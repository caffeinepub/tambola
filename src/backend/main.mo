import Map "mo:core/Map";
import Set "mo:core/Set";
import Text "mo:core/Text";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";

actor {
  // Type definitions
  type BetId = Text;
  type RoomCode = Text;

  type Bet = {
    id : BetId;
    creatorId : Principal;
    acceptorId : ?Principal;
    prizeType : Text;
    stakeAmount : Nat;
    gameId : Text;
    status : {
      #open;
      #matched;
      #won;
      #lost;
      #refunded;
    };
    winnerId : ?Principal;
  };

  public type GameRoom = {
    hostId : Principal;
    hostName : Text;
    calledNumbers : [Nat];
    prizeWinners : Text;
    isActive : Bool;
  };

  var nextBetId = 1;

  let bets = Map.empty<BetId, Bet>();
  let gameRooms = Map.empty<RoomCode, GameRoom>();
  let activeUsers = Set.empty<Principal>();
  var configuration : ?Stripe.StripeConfiguration = null;

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Bet management
  public shared ({ caller }) func createBet(prizeType : Text, stakeAmount : Nat, gameId : Text) : async BetId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create bets");
    };

    let betId = nextBetId.toText();
    nextBetId += 1;

    let newBet : Bet = {
      id = betId;
      creatorId = caller;
      acceptorId = null;
      prizeType;
      stakeAmount;
      gameId;
      status = #open;
      winnerId = null;
    };

    bets.add(betId, newBet);
    activeUsers.add(caller);
    betId;
  };

  public shared ({ caller }) func acceptBet(betId : BetId) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can accept bets");
    };

    switch (bets.get(betId)) {
      case (null) { Runtime.trap("Bet not found") };
      case (?bet) {
        if (bet.creatorId == caller) {
          Runtime.trap("Cannot accept your own bet");
        };

        switch (bet.status) {
          case (#open) {
            let updatedBet = {
              bet with
              acceptorId = ?caller;
              status = #matched;
            };
            bets.add(betId, updatedBet);
            activeUsers.add(caller);
            "Bet accepted";
          };
          case (_) { Runtime.trap("Bet is not open to accept") };
        };
      };
    };
  };

  public shared ({ caller }) func settleBet(betId : BetId, winnerId : Principal) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can settle bets");
    };

    switch (bets.get(betId)) {
      case (null) { Runtime.trap("Bet not found") };
      case (?bet) {
        switch (bet.status) {
          case (#matched) {
            let isValidWinner = bet.creatorId == winnerId or (
              switch (bet.acceptorId) {
                case (?acceptorId) { acceptorId == winnerId };
                case (null) { false };
              }
            );

            if (not isValidWinner) {
              Runtime.trap("Winner must be a participant in the bet");
            };

            let updatedBet = {
              bet with
              status = #won;
              winnerId = ?winnerId;
            };
            bets.add(betId, updatedBet);
            "Bet settled";
          };
          case (_) { Runtime.trap("Bet is not matched and cannot be settled") };
        };
      };
    };
  };

  public shared ({ caller }) func refundBet(betId : BetId) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can refund bets");
    };

    switch (bets.get(betId)) {
      case (null) { Runtime.trap("Bet not found") };
      case (?bet) {
        switch (bet.status) {
          case (#open) {
            bets.remove(betId);
            "Open bet removed";
          };
          case (#matched) {
            let updatedBet = {
              bet with
              status = #refunded;
            };
            bets.add(betId, updatedBet);
            "Matched bet refunded";
          };
          case (#won) { Runtime.trap("Cannot refund a completed bet") };
          case (#lost) {
            bets.remove(betId);
            "Lost bet removed";
          };
          case (#refunded) { "Bet already refunded" };
        };
      };
    };
  };

  public query ({ caller }) func listOpenBets(gameId : Text) : async [Bet] {
    let matchingBets = List.empty<Bet>();

    for ((_, bet) in bets.entries()) {
      if (bet.gameId == gameId and bet.status == #open) {
        matchingBets.add(bet);
      };
    };

    matchingBets.toArray();
  };

  public query ({ caller }) func getBetById(betId : BetId) : async Bet {
    switch (bets.get(betId)) {
      case (?bet) {
        let isParticipant = bet.creatorId == caller or (
          switch (bet.acceptorId) {
            case (?acceptorId) { acceptorId == caller };
            case (null) { false };
          }
        );

        if (not isParticipant and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view bets you participate in");
        };

        bet;
      };
      case (null) { Runtime.trap("Bet not found") };
    };
  };

  public query ({ caller }) func getUserBets(userId : Principal) : async [Bet] {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own bets");
    };

    let matchingBets = List.empty<Bet>();

    for ((_, bet) in bets.entries()) {
      if (
        bet.creatorId == userId or
        (switch (bet.acceptorId) {
          case (?acceptorId) { acceptorId == userId };
          case (null) { false };
        })
      ) {
        matchingBets.add(bet);
      };
    };

    matchingBets.toArray();
  };

  public shared ({ caller }) func withdrawRequest(amount : Nat) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can request withdrawals");
    };
    Runtime.trap("Withdraw requests not supported in this version of the game");
  };

  public query ({ caller }) func getBalance() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view balance");
    };
    0;
  };

  public query ({ caller }) func getActiveUsers() : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view active users");
    };
    activeUsers.toArray();
  };

  // User profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Stripe integration
  public query func isStripeConfigured() : async Bool {
    configuration != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    configuration := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (configuration) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create checkout sessions");
    };
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Multiplayer game room management
  public shared ({ caller }) func createRoom(roomCode : Text, hostName : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create rooms");
    };

    // Validate room code length is 6 characters
    let length = roomCode.chars().size();
    if (length != 6) {
      Runtime.trap("Room code must be 6 characters");
    };

    if (gameRooms.containsKey(roomCode)) {
      Runtime.trap("Room code already exists. Please choose a different code.");
    };

    let newRoom : GameRoom = {
      hostId = caller;
      hostName;
      calledNumbers = [];
      prizeWinners = "";
      isActive = true;
    };

    gameRooms.add(roomCode, newRoom);
    "Room created successfully";
  };

  public shared ({ caller }) func joinRoom(roomCode : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join rooms");
    };

    switch (gameRooms.get(roomCode)) {
      case (null) { Runtime.trap("Room not found") };
      case (?room) {
        if (not room.isActive) {
          Runtime.trap("This room is no longer active");
        };
        "(joinRoom) Room joined successfully";
      };
    };
  };

  public shared ({ caller }) func updateRoom(roomCode : Text, calledNumbers : [Nat], prizeWinners : Text, isActive : Bool) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update rooms");
    };

    switch (gameRooms.get(roomCode)) {
      case (null) { Runtime.trap("Room not found") };
      case (?room) {
        // Only the room host or admins can update the room
        if (caller != room.hostId and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the room host or admins can update the room");
        };

        let updatedRoom = {
          room with
          calledNumbers;
          prizeWinners;
          isActive;
        };
        gameRooms.add(roomCode, updatedRoom);
        "Room updated successfully";
      };
    };
  };

  public query ({ caller }) func getRoomState(roomCode : Text) : async GameRoom {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view room state");
    };

    switch (gameRooms.get(roomCode)) {
      case (null) { Runtime.trap("Room not found") };
      case (?room) { room };
    };
  };
};
