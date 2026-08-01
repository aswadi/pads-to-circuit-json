# pads-to-circuit-json

Convert PADS PCB files into Circuit JSON with source-linked loss diagnostics.

The converter accepts PADS text, bytes, or a parsed `padsts` document. It emits
schema-valid PCB Circuit JSON for the currently supported geometry and reports
every skipped or approximated normalized entity. The report also separates
normalized source, mapped-entity, emitted-element, and per-section totals.
Decoded `reference.pin` assignments become source and PCB ports, electrical
pads and plated holes reference those ports, and routed segments share one
source trace per net.

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

```ts
const strictResult = convertPadsToCircuitJson(sourceBytes, { strict: true })
if (!strictResult.report.lossless) {
  throw new Error(
    strictResult.report.diagnostics.map(({ code }) => code).join(", "),
  )
}
```

Large conversions can report deterministic stage progress and can be aborted
between stages with a standard `AbortSignal`:

```ts
const controller = new AbortController()
const result = convertPadsToCircuitJson(sourceBytes, {
  signal: controller.signal,
  onProgress: ({ stage, completedStages, totalStages }) => {
    console.log(`${completedStages}/${totalStages}: ${stage}`)
  },
})
```

Cancellation throws `PadsToCircuitJsonAbortError`, whose `name` is
`"AbortError"` and whose `stage` identifies the last active stage.

`padsts` normalizes source coordinates to nanometers; this adapter converts
them to Circuit JSON millimeters by exactly `1_000_000 nm/mm`. Normalized X/Y
coordinates and counter-clockwise rotations pass through unchanged. Physical
PADS layer 1 maps to `top`, the final physical layer maps to `bottom`, and
intermediate copper layers map to `inner1` through `inner8`.

This prerelease validates output against `circuit-json@0.0.456`. The current
workspace uses the local `padsts` cutout increment based on
`tscircuit/padsts#6e23a59`; advance the package pin to that published commit
before release. The committed corpus proves PADS ASCII `V9.4`, `V9.5`, `V10.0`,
`V2005.0`, and `V2007.0`, including the `BASIC-250L` header variant. Other ASCII
versions accepted by `padsts` are converted on a best-effort, fully diagnosed
basis. Pinned fixtures also cover every native binary container recognized by
`padsts` (`0x2021`, `0x2025`, `0x2026`, and `0x2027`). Those binary tests lock in
the current partial decode and intentionally empty Circuit JSON result; native
binary semantics are not yet a supported end-to-end conversion target.

## Current mapping coverage

Implemented in this initial pass:

- line-segment polygon board outlines, contained polygon/circular cutouts, and
  layer counts;
- placed components with bounds derived from decoded footprint geometry;
- circular, rectangular, rounded-rect, pill, and rotated SMT pads;
- circular and slotted plated/non-plated holes, with plated drill offsets and
  decoded outer pad geometry combined into compound plated-hole elements;
- through, blind, buried, and multilayer vias;
- routed copper paths;
- compound copper regions with polygonal and circular voids;
- rectangular and circular layer keepouts;
- component silkscreen paths, circles, reference/value labels, and static
  footprint text such as pin legends and polarity marks; and
- component fabrication paths and circles.

Known approximations are explicit. Circular board, route, and silkscreen arcs
are segmented at no more than five degrees per edge. Circular copper and
fabrication geometry uses the same tolerance. PADS stroke fonts are substituted
with `tscircuit2024`, per-layer via pad sizes/shapes collapse to one circular
maximum diameter, and PADS keepout restriction categories collapse to a general
layer keepout. Copper boundary strokes, mask/paste artwork, global text,
arbitrary keepout polygons, and unsupported drawing layers remain
diagnosed rather than silently omitted. The full roadmap is in
[CHECKLIST.md](./CHECKLIST.md), and the mapping matrix is in
[docs/compatibility.md](./docs/compatibility.md). Stable diagnostic codes and
remediation guidance are in [docs/diagnostics.md](./docs/diagnostics.md).

`padsts` thermal-relief and antipad entities are included in mapping coverage.
They remain diagnosed rather than emitted: `pcb_thermal_spoke` requires a
verified `pcb_ground_plane`, while current normalized PADS copper artwork does
not yet prove which plane owns each relief. The paired thermal fixture makes
this known visual difference explicit.

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
bun run benchmark:ems4
bun test
bun run check
```

When adding a PADS fixture, add exactly one corresponding `*.test.ts` file and
at least one paired visual snapshot. Inspect the image before accepting it; a
new snapshot is evidence to review, not proof of correctness.

The comparison helper also accepts a `boardViewBox` in millimeters. It passes
the same lower-left board-coordinate window to both renderers and clips each
stacked pane independently, which makes close inspection of voids, arcs, pads,
and keepouts deterministic.

The focused component-label fixture and LCORE2 views compare top and bottom
reference/value labels with exact board-coordinate anchors, alignment,
rotation, mirroring, layer, and component ownership. `padsts` can isolate the
source side with `visibleTextReferences`; Circuit JSON substitutes the PADS
stroke font with `tscircuit2024` and records that approximation per label.

The LCORE2 focused views deliberately include a mirrored, rotated bottom-side
PADS text record. `padsts` renders it on the physical bottom-silkscreen layer;
the Circuit JSON pane omits it because global PADS text has no component owner
and the available ownerless note-text shape cannot preserve its rotation. The
corresponding `circuit-json-text-not-represented` diagnostics make that visible
difference explicit.

Renderer colors are not semantic comparisons. In the ClaySight cutout views,
`padsts` shows board voids as dark negative space, while `circuit-to-svg`
colors native `pcb_cutout` elements magenta on its drill layer. Their centers,
diameters, and board-coordinate viewport alignment are the invariants under
test.

## License

MIT
