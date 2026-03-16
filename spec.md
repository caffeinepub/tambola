# Tambola

## Current State
- Full-stack Tambola (Housie/Bingo) game with mobile OTP + password login
- Home screen and gameplay both run in landscape (full app forced horizontal)
- Players start with 1000 coins on registration; no login bonus
- No multiplayer — game state is local to each device
- Backend has authorization, stripe, http-outcalls; manages bets
- PlayerMode handles ticket purchase, auto-caller (3s), prize claiming
- Split horizontal layout in PlayerMode: left = number+controls, right = tickets+prizes

## Requested Changes (Diff)

### Add
- **Login coins**: Award a daily login bonus of 100 coins to existing players each time they log in (show toast notification). New registrations already get 1000 coins starting balance.
- **Multiplayer rooms**: Backend stores game rooms (code → room data). Host creates a room when starting a game, gets a 6-character share code. Guests enter the code on the Home screen to join the host's game and see the same called numbers in real-time (polling every 3s).
- **Multiplayer room data in backend**: room code, host name, called numbers, prize winners, game status, list of joined player names.

### Modify
- **Home screen orientation**: Remove landscape enforcement from Home screen. Home screen should display in portrait mode (natural device orientation). Add `portrait` orientation lock attempt when rendering Home.
- **PlayerMode orientation**: Enforce landscape-only. Attempt `screen.orientation.lock('landscape')` on game start, and apply CSS `transform: rotate(90deg)` fallback for devices that don't support the API. Show a "Rotate Your Device" overlay if in portrait (no JS rotation API support).
- **GameContext**: Add `loginBonus` field and daily login bonus logic. Add wallet top-up of +100 on login (only if last login was a different day). Add multiplayer state: `multiplayerRoom`, `joinRoom`, `createRoom`, `syncRoomState`.
- **Home screen**: Add a "Join Game" input field for entering a 6-character room code. Show room code to the host after game starts. Update coin balance after login bonus is awarded.

### Remove
- Nothing removed.

## Implementation Plan
1. **Backend (Motoko)**: Add `GameRoom` type and stable storage. Implement `createRoom(code, hostName)`, `joinRoom(code, playerName)`, `updateRoomState(code, calledNumbers, prizes, status)`, `getRoomState(code)` query. Keep all existing bet/stripe logic intact.
2. **GameContext.tsx**: Add daily login bonus (+100 coins) on `loginWithMobile`. Add multiplayer state management: `multiplayerRoom` (room code + role + synced state), `createRoom`, `joinRoom`, `leaveRoom`. Add polling hook that calls `getRoomState` every 3s when in a room as a guest.
3. **Home.tsx**: Attempt `screen.orientation.lock('portrait')` on mount. Add "Join a Game" section with code input + join button. Show share code to host when a room is active.
4. **PlayerMode.tsx**: On game start, attempt `screen.orientation.lock('landscape')`. Add `useEffect` to detect portrait and show rotate overlay. Create room in backend when host starts the game.
5. **Login.tsx**: After successful login, display toast: "🎉 +100 Login Bonus coins!"
