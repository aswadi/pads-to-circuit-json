# Performance budget

EMS4 Rev2 is the representative large-board gate. Its pinned ASCII source is
1,028,182 bytes and currently normalizes to 9,214 geometry entities before
emitting 15,961 Circuit JSON elements.

`bun run benchmark:ems4` verifies these budgets on a single process:

- parse plus conversion: at most 15 seconds;
- resident memory after conversion: at most 512 MiB.

SVG rendering is intentionally excluded because it measures the two external
renderers and snapshot serialization as well as this adapter. The three-view
EMS4 visual regression test has a separate 90-second timeout to accommodate
slower shared CI runners without weakening the converter benchmark above.

The converter indexes component geometry by reference in one pass. Component,
net, and emitted-ID reference resolution use maps or sets so increasing the
board's placements does not repeatedly scan all pads and paths.
