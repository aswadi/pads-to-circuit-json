# Performance budget

EMS4 Rev2 is the representative large-board gate. Its pinned ASCII source is
1,028,182 bytes and currently normalizes to 9,214 geometry entities before
emitting 15,961 Circuit JSON elements.

`bun run benchmark:ems4` verifies these budgets on a single process:

- parse plus conversion: at most 15 seconds;
- resident memory after conversion: at most 512 MiB.

SVG rendering is intentionally excluded because it measures the two external
renderers and snapshot serialization as well as this adapter. CI visual tests
have a separate 30-second timeout for the three EMS4 comparison views.

The converter indexes component geometry by reference in one pass. Component,
net, and emitted-ID reference resolution use maps or sets so increasing the
board's placements does not repeatedly scan all pads and paths.
