# Level 1 solution — build 6

The player loses immediately on reaching zero, including during cancellation
against a larger opposite-sign army. Enemy survivors never become the player's
army. Multiplication that reverses sign is a discrete operation, not a countdown
through zero.

| Action | Player value |
|---|---:|
| Start | +24 |
| Choose ×(−2) | −48 |
| Steer left so −20 arrives first; same signs merge | −68 |
| Meet the approaching +48; cancel 48 from both | −20 |
| Choose ×(−1) | +20 |
| Pass the blue stone gate: positive values only, unchanged | +20 |
| Subtract 12 | +8 |
| Meet −4; cancel 4 from both | +4 |
| Choose ÷2 | +2 |
| Final gate: |value| < 6 | Pass: 2 < 6 |

The final ×(−2) choice instead gives −8, which fails because 8 is not below 6.
The −4 encounter replaces the previous −16 encounter: +8 against −16 would
exhaust the player's army and must now be a loss.

All 32 arithmetic choice combinations were checked: one win, eight zero losses,
twelve wrong-sign gate failures, and eleven final-size failures. The full winning
route was also completed through the actual browser controls.

Other outcomes:
- +48 arriving first against −48 ends at zero immediately.
- Keeping −20 with ×(+1) fails at the blue stone gate, in any lane.
- Adding 12 after the blue gate produces +32, then +28 after −4; neither final
  choice fits the size gate.
- Choosing +16 initially leads to +68 after both incoming groups. Keeping it
  positive passes the blue gate, but the later quantities remain too large.

Both armies approach directly from their own positions; actual front contact
determines arrival order. The other army continues approaching during a local
impact. The full road's sign check cannot be bypassed by steering. Blue stone
means positive and red stone means negative; this level uses a blue gate.
