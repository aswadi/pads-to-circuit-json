# Downloaded PADS fixtures

Run `bun run test:download-assets` before the visual test suite. Downloads are
pinned by commit, byte length, and Git blob SHA in
[`scripts/test-assets.ts`](../../scripts/test-assets.ts).

The files under `tests/assets/downloaded` are intentionally gitignored. Each
PADS file has one corresponding `*.test.ts` file and at least one paired visual
snapshot: the native `padsts` rendering on the left and converted Circuit JSON
rendered by `circuit-to-svg` on the right. Focused views pass a millimeter-based
`boardViewBox` through both renderers so the same real board region appears in
each column.

Update snapshots with `BUN_UPDATE_SNAPSHOTS=1 bun test`, then inspect every
changed whole-board and zoom SVG before committing it.

The current matrix covers ASCII headers `V9.4`, `V9.5`, `V10.0`, `V2005.0`, and
`V2007.0`, plus native binary containers `0x2021`, `0x2025`, `0x2026`, and
`0x2027`. Binary structure/placement snapshots intentionally show decoded PADS
candidate data beside an empty Circuit JSON pane until outlines, footprint
bounds, routes, and vias are verified by `padsts`.

When adding a fixture:

1. Use a stable upstream repository and pin an immutable commit URL.
2. Record the byte length, Git blob SHA-1, source page, and license page in
   `scripts/test-assets.ts`.
3. Keep the downloaded file under `tests/assets/downloaded`; do not commit it.
4. Add exactly one same-named test file with exact Circuit JSON assertions and
   at least one paired snapshot.
5. Add board-coordinate zooms for dense or easily misread geometry, render the
   snapshots, and visually compare positions, dimensions, layers, and known
   renderer-policy differences.
