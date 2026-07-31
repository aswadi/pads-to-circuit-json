# Downloaded PADS fixtures

Run `bun run test:download-assets` before the visual test suite. Downloads are
pinned by commit, byte length, and Git blob SHA in
[`scripts/test-assets.ts`](../../scripts/test-assets.ts).

The files under `tests/assets/downloaded` are intentionally gitignored. Each
PADS file has one corresponding `*.test.ts` file and at least one paired visual
snapshot: the native `padsts` rendering on the left and converted Circuit JSON
rendered by `circuit-to-svg` on the right.
