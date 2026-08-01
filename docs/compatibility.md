# Compatibility and mapping policy

## Version contract

The current prerelease is tested with the local `padsts` cutout increment based
on `tscircuit/padsts#6e23a59` and `circuit-json@0.0.456`. Its fixture corpus
covers PADS ASCII `V9.4`, `V9.5`, `V10.0`, `V2005.0`, and `V2007.0`; the `V10.0`
ClaySight file also exercises the `BASIC-250L` header variant. The package
dependency must be advanced to the published `padsts` cutout commit before
release. Other ASCII versions recognized by `padsts` may produce useful partial
output, but are not in the supported test matrix yet.

All fixed native binary container versions recognized by `padsts` have pinned
adapter fixtures: `0x2021`, `0x2025`, `0x2026`, and `0x2027`. The tests assert
their decoded placement/debug entity counts, exact diagnosed loss, and paired
visual snapshots. No binary fixture currently has a verified outline plus
footprint bounds, so the adapter deliberately emits no Circuit JSON rather than
presenting candidate geometry as fabrication data. Binary input is therefore
format-covered but not claimed as end-to-end semantically supported.

The conversion report currently uses schema version `1`, inherited from the
`padsts` report. Fields may only be added compatibly within schema version `1`.
Renaming/removing fields or changing their meaning requires a schema-version
increment. Diagnostic codes are stable identifiers; message wording is not an
API contract.

`mappingCoverage` records normalized source and mapped entity totals, emitted
Circuit JSON counts by type, and source/mapped/diagnostic counts per PADS
section. A mapped entity may emit multiple Circuit JSON elements (for example,
a placement emits both source and PCB components), so these totals intentionally
measure different things.

## Mapping matrix

| PADS normalized entity | Circuit JSON output | Current policy |
| --- | --- | --- |
| Closed board outline | `pcb_board` polygon | Circular edges are segmented at 5° or less. |
| Contained BOARD contour or `BRDCIR` | `pcb_cutout` polygon/circle | Closed contained contours and circular diameter records are board-linked cutouts; curved polygon contours are segmented at 5° or less. |
| Placement | `source_component`, `pcb_component` | Reference designator and PADS part-type name become source display name/value; position, rotation, side, and bounds come from decoded placement/footprint geometry. |
| Shared part decal | Flattened component-owned PCB geometry | `padsts` resolves each decal definition before placement; Circuit JSON receives one transformed physical geometry set per component instance with unique IDs, rather than duplicate reusable definitions. |
| Surface pad | `pcb_smtpad` | Circle, square, rect, rounded rect, pill, rotated forms, and exact chamfer polygons supported on top/bottom copper; electrical pads reference their resolved `pcb_port`. |
| Component drill/slot | `pcb_plated_hole` or `pcb_hole` | Round and oblong geometry supported; plated electrical holes reference their resolved `pcb_port` and combine with the associated circular/rectangular/rounded/chamfered copper pad. Drill-to-pad offsets and rotations are preserved by compound plated-hole shapes. Non-plated holes retain separate copper when present. |
| Via | `pcb_via` | Layer span supported; vias on routed nets reference a representative `pcb_trace`; heterogeneous per-layer pad stacks collapse with a diagnostic. |
| Nets and terminals | `source_net`, `pcb_net`, `source_port`, `pcb_port` | PADS `reference.pin` assignments are resolved with indexed lookups. |
| Routed copper | `source_trace` + `pcb_trace` | Width and layer supported; arcs are segmented. One source trace per net connects its source ports, all routed PCB segments reference that shared record, and vias link to a representative routed trace for the same net. |
| Closed copper artwork | `pcb_copper_pour` BRep | Polygon/circle outers and contained polygon/circle voids supported. Boundary stroke width is diagnosed as omitted. |
| Thermal relief | none yet | Counted and diagnosed. `pcb_thermal_spoke` is withheld until the source copper can be associated with a verified `pcb_ground_plane`; shape, dimensions, spoke count/orientation, net, layer, and provenance remain available from `padsts`. |
| Antipad | none yet | Counted and diagnosed. Circuit JSON has no standalone antipad entity, and the adapter does not invent plane ownership. |
| Rect/circle keepout | `pcb_keepout` | Layer supported; PADS restriction categories collapse with a diagnostic, and unavailable categories are diagnosed as inferred general keepouts. |
| Component silkscreen | silkscreen path/circle | Paths and circles supported; arcs are segmented. |
| Component reference/value label | `pcb_silkscreen_text` | Text, component ownership, height, anchor alignment, rotation, mirroring, and front/back side are preserved. PADS stroke fonts and stroke widths are substituted with `tscircuit2024` and diagnosed. |
| Component static decal text | `pcb_silkscreen_text` | Pin legends, polarity marks, and other static footprint text preserve component ownership, height, anchor alignment, rotation, mirroring, and front/back side. PADS stroke fonts and stroke widths are substituted with `tscircuit2024` and diagnosed. |
| Component fabrication artwork | fabrication-note path | Paths supported; circles/arcs are segmented. |
| Global text | none | Diagnosed because component-owned layer text schemas require ownership not present in normalized board text; ownerless note text cannot preserve all current rotation/layer semantics. |
| Mask/paste artwork | none | Diagnosed pending a faithful target mapping. |
| Other drawing layers | none | Diagnosed with source provenance. |

Every emitted element is validated against the installed Circuit JSON schema.
An element that unexpectedly fails validation is removed and reported as
`circuit-json-emitted-element-invalid` rather than leaking invalid output.

## Loss and strict mode

`report.lossless` is derived from parser coverage plus adapter diagnostics. A
conversion can be visually close and still be lossy because undecoded source
records, omitted metadata, or approximations remain. `{ strict: true }` keeps
the partial output available for inspection and adds the error diagnostic
`strict-circuit-json-conversion-would-be-lossy`.
