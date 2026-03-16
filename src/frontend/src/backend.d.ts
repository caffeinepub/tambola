import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface GameRoom {
    hostName: string;
    calledNumbers: Array<bigint>;
    isActive: boolean;
    hostId: Principal;
    prizeWinners: string;
}
export type BetId = string;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface Bet {
    id: BetId;
    status: Variant_won_lost_open_refunded_matched;
    winnerId?: Principal;
    stakeAmount: bigint;
    creatorId: Principal;
    gameId: string;
    acceptorId?: Principal;
    prizeType: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface UserProfile {
    name: string;
}
export interface http_header {
    value: string;
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_won_lost_open_refunded_matched {
    won = "won",
    lost = "lost",
    open = "open",
    refunded = "refunded",
    matched = "matched"
}
export interface backendInterface {
    acceptBet(betId: BetId): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createBet(prizeType: string, stakeAmount: bigint, gameId: string): Promise<BetId>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createRoom(roomCode: string, hostName: string): Promise<string>;
    getActiveUsers(): Promise<Array<Principal>>;
    getBalance(): Promise<bigint>;
    getBetById(betId: BetId): Promise<Bet>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getRoomState(roomCode: string): Promise<GameRoom>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserBets(userId: Principal): Promise<Array<Bet>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    joinRoom(roomCode: string): Promise<string>;
    listOpenBets(gameId: string): Promise<Array<Bet>>;
    refundBet(betId: BetId): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    settleBet(betId: BetId, winnerId: Principal): Promise<string>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateRoom(roomCode: string, calledNumbers: Array<bigint>, prizeWinners: string, isActive: boolean): Promise<string>;
    withdrawRequest(amount: bigint): Promise<string>;
}
