# pads-to-circuit-json

Convert PADS PCB files into Circuit JSON with source-linked loss diagnostics.

The converter accepts PADS text, bytes, or a parsed `padsts` document. It emits
schema-valid PCB Circuit JSON for the currently supported geometry and reports
every skipped or approximated normalized entity.

## Usage

```ts
import { convertPadsToCircuitJson } from "pads-to-circuit-json"

const sourceBytes = await Bun.file("board.asc").bytes()
const { circuitJson, report } = convertPadsToCircuitJson(sourceBytes)

if (!report.lossless) {
  console.warn(report.diagnostics)
}
```

Pass `{ strict: true }` to add an error diagnostic whenever the conversion is
lossy. Strict mode preserves the partial Circuit JSON and complete report so a
caller can inspect exactly what needs attention.

`padsts` normalizes source coordinates to nanometers; this adapter converts
them to Circuit JSON millimeters by exactly `1_000_000 nm/mm`. Normalized X/Y
coordinates and counter-clockwise rotations pass through unchanged. Physical
PADS layer 1 maps to `top`, the final physical layer maps to `bottom`, and
intermediate copper layers map to `inner1` through `inner8`.

## Current mapping coverage

Implemented in this initial pass:

- line-segment polygon board outlines and layer counts;
- placed components with bounds derived from decoded footprint geometry;
- circular, rectangular, rounded-rect, pill, and rotated SMT pads;
- circular and slotted plated/non-plated holes;
- through, blind, buried, and multilayer vias;
- routed copper paths; and
- component silkscreen paths.

Known approximations are explicit. Circular board, route, and silkscreen arcs
are segmented at no more than five degrees per edge. Chamfered pads currently
use their enclosing rectangle, and per-layer via pad sizes/shapes currently
collapse to one circular maximum diameter. Copper artwork, cutouts, keepouts,
and text remain diagnosed rather than silently omitted. The full roadmap is in
[CHECKLIST.md](./CHECKLIST.md).

## Repository boundaries

- This package owns PADS-to-Circuit JSON mapping policy and its loss report.
- [`padsts`](https://github.com/tscircuit/padsts) owns PADS parsing, normalized
  geometry, provenance, and native SVG rendering.
- [`circuit-json`](https://github.com/tscircuit/circuit-json) owns the output
  schema.
- [`circuit-json-to-pads`](https://github.com/tscircuit/circuit-json-to-pads)
  owns the reverse mapping.

## Visual tests

Downloaded fixtures are pinned by commit, size, and Git blob hash, then kept out
of Git. Each PADS file has one descriptive test file and a paired snapshot:
`padsts` renders the source on the left; `circuit-to-svg` renders the converted
Circuit JSON on the right. `stack-svgs` composes the two views.

```bash
bun install
bun run test:download-assets
bun test
bun run check
```

When adding a PADS fixture, add exactly one corresponding `*.test.ts` file and
at least one paired visual snapshot. Inspect the image before accepting it; a
new snapshot is evidence to review, not proof of correctness.

## License

MIT
