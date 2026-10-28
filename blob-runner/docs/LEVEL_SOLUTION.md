# Course solutions — build 10
October 28, 2026

Positions are shuffled for each new run. Follow operation labels, not left/right.
Restart repeats the seed; Start new run shuffles positions. Difficulty changes
pace only, so every mathematical solution remains available at every pace.

## Example solutions

| Course | Successful sequence (quantity after each event) |
|---|---|
| Riverstone Run | +24 → ×(−2): −48 → join −20: −68 → cancel +48: −20 → ×(−1): +20 → POSITIVE gate → −12: +8 → meet −4: +4 → ×(−1): −4 → NEGATIVE gate → +8: +4 → ÷4: +1 → size gate |
| Amber Crossing | +40 → ×(−2): −80 → join −28: −108 → cancel +80: −28 → ×(−1): +28 → POSITIVE gate → −20: +8 → ×2: +16 → meet −4: +12 → −16: −4 → NEGATIVE gate → +8: +4 → ÷4: +1 → size gate |
| Twilight Rush | +56 → ×(−2): −112 → join −36: −148 → cancel +112: −36 → ×(−1): +36 → POSITIVE gate → −28: +8 → +4: +12 → meet −4: +8 → ×(−1): −8 → NEGATIVE gate → +16: +8 → ÷4: +2 → size gate |

Every final gate requires **0 < |value| < 5**. Both positive and negative small
swarms can pass it. The sign gates earlier in the course test sign only.

## Alternative routes

All three courses also support a positive opening (+8). Survive the two
incoming armies, retain the positive sign, and choose the larger subtraction:
−52, −92, or −132 respectively. This returns the intended quantity to +8.
Positive openings can survive either incoming order; negative openings must
merge with red before the equal positive swarm arrives.

Later operations provide several ways through the negative gate and final
size gate. Different successful routes end with different signed values.
The exhaustive solver finds 12, 18, and 18 successful choice sequences in the
three courses. Shuffling positions does not change those counts.

## Understandable failures

- Negative opening, blue first: the player's army reaches zero and loses.
- Arrive negative at POSITIVE +, or positive at NEGATIVE −: the whole army stops.
- Choose a subtraction inappropriate for the opening: later magnitude or sign
  consequences can block progress.
- Reach zero through an operation or cancellation: immediate loss. Enemy
  survivors never become the player's new army.
- Final ×(−2): every surviving quantity is a nonzero multiple of four; doubling
  its magnitude cannot fit the final capacity of five. The whole army stops.
- Final ÷4 is always integral. It wins only when earlier choices produce a
  nonzero magnitude below twenty.

`BlobMath.solve(course)` enumerates every operation branch and both initial
encounter orders. Tests check 100 position seeds for each course, all difficulty
speeds, distinct signed endings, strict gate comparisons, and the zero rule.
