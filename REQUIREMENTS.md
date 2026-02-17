# Gobbo Market -- Requirements (RALPH Loop)

## Cycle 1: Core Foundation
- [R] Core game state, save/load, event bus
- [A] Screen manager, DOM component pattern
- [L] Basic buy/sell flow without minigames
- [P] 60fps game loop, efficient DOM updates
- [H] Input validation, save corruption recovery

## Cycle 2: Minigames
- [R] Forge, Haggle, Appraisal, RuneCraft
- [A] MinigameBase interface, Canvas rendering
- [L] Scoring, quality determination, price modifiers
- [P] Canvas optimization, object pooling
- [H] Edge cases (rapid clicks, resize, focus loss)

## Cycle 3: Market Simulation
- [R] Customer types, pricing engine, supply/demand
- [A] Customer queue system, tier-gated spawning
- [L] Dynamic pricing, customer personality effects
- [P] Efficient queue processing
- [H] Price floor/ceiling guards, balance testing

## Cycle 4: Progression & Polish
- [R] 5 tiers, upgrades, recipes, milestones, max coin goal
- [A] Milestone/achievement system
- [L] Unlock chains, tier transitions, endgame
- [P] Save file size optimization
- [H] Playtest balance, completion time validation

---

## Iteration Log

### v1.0 - Initial Implementation
- All 4 cycles implemented
- 4 minigames: Forge, Haggle, Appraisal, RuneCraft
- 5 market tiers from Muddy Alley to Grand Exchange
- Target: completable in ~3 hours, max 1M coins

### v1.1 - Polish Pass
- Welcome/title screen for new and returning players
- Customer patience bars with visual countdown
- Staggered card entrance animations
- Enchanted item glow pulse effect
- Sale coin toast notifications
- Next tier progress bars (coins + reputation)
- New Game / Reset button with confirmation
- Faster initial customer spawn + instant first customer
- Forge minigame speed rebalanced (delta-time, slower base speed)
- Reputation levels: Nobody → Newcomer → Known → Respected → Renowned → Legendary
- 12 integration tests covering craft-sell, progression, milestones, save/load, upgrades
- Total: 120 tests across 14 files
