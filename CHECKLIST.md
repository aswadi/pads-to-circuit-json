# pads-to-circuit-json implementation checklist

The converter is complete only when every parsed source entity is either mapped
to Circuit JSON or named in a machine-readable diagnostic. A successful
conversion must never silently drop data.

## Repository bootstrap

- [x] Declare the public repository through `tscircuit/create-repo` with the
      `maintainers` and `staff` teams.
- [x] Use the tscircuit handbook's vanilla `lib`/`tests` repository layout.
- [x] Publish source from `lib/index.ts` and include only `lib` in the package.
- [x] Disable Bun lockfile persistence and ignore `bun.lock` and `.cursor`.
- [x] Add the shared Biome configuration.
- [x] Add Bun test, typecheck, and format-check GitHub Actions workflows.
- [x] Add an MIT license, repository metadata, and development documentation.
- [x] Define the initial typed converter, options, result, and diagnostic
      contracts without claiming that conversion is implemented.

## Package and API boundary

- [x] Publish `padsts` or establish a pinned source-install strategy, then add it
      as a runtime dependency.
- [x] Add and pin a compatible `circuit-json` schema dependency.
- [x] Document supported PADS and Circuit JSON version ranges.
- [x] Expose `convertPadsToCircuitJson(source, options)` as the primary API.
- [x] Accept PADS text, bytes, and an already-parsed `padsts` document without
      reparsing.
- [x] Accept readonly source documents and avoid mutating parser output.
- [x] Stabilize the result/report schema and publish its compatibility policy.
- [x] Move any conversion policy out of `padsts`; retain a documented
      compatibility/deprecation entry point only if downstream users need it.
- [x] Keep PADS parsing, source spans, geometry, and rendering in `padsts`; keep
      Circuit JSON mapping policy in this package.

## Source identity and normalization

- [x] Assign stable IDs to source sections and records that lack identifiers.
- [x] Preserve source file, section, record, line, and byte-offset provenance
      wherever `padsts` exposes it.
- [x] Normalize PADS units to millimeters once at the adapter boundary.
- [x] Document and test coordinate origin, Y-axis, and rotation conventions.
- [x] Normalize top/bottom layers and mirrored rotations consistently.
- [x] Resolve references between parts, decals, pad stacks, pins, nets, and
      routes before mapping.
- [x] Detect dangling references and duplicate identifiers.
- [x] Make parse and normalization failures actionable with source locations.

## Circuit JSON mapping

- [x] Emit board metadata and a stable `pcb_board` identity.
- [x] Map closed board outlines, line segments, circular arcs, and cutouts.
- [x] Map the PADS layer stack to Circuit JSON layer names and ordering, with a
      diagnostic when more than eight inner layers cannot be named.
- [x] Map component instances, reference designators, PADS part-type display
      values, positions, rotations, and top/bottom placement.
- [x] Resolve shared part decals once in `padsts` and flatten exactly one
      transformed physical geometry set per Circuit JSON component instance,
      with unique IDs and no duplicate reusable definitions.
- [x] Map SMT pad shapes, sizes, rotations, rounded/chamfered corner
      treatments, and top/bottom layers.
- [x] Map plated/non-plated through holes, oblong drills, and slots; combine
      plated drills with their decoded circular, rectangular, rounded, or
      exact chamfer-polygon pad instead of emitting a duplicate SMT pad.
- [x] Map through/blind/buried vias, diameters, drills, and layer spans.
- [x] Map routed copper segments, widths, layers, and via transitions; routed
      vias reference a representative emitted PCB trace for their decoded net.
- [x] Preserve circular arcs where Circuit JSON supports them and define a
      documented segmentation tolerance otherwise.
- [x] Map nets, pins, pad associations, and connectivity.
- [x] Map component reference/value labels to component-owned silkscreen text
      with alignment, rotation, mirroring, side, and font-approximation
      diagnostics.
- [x] Map component-owned static part-decal silkscreen text, including pin
      legends and polarity marks, with the same placement transforms and
      explicit font approximation.
- [ ] Map remaining global silkscreen, fabrication, and assembly text where
      Circuit JSON can preserve its semantics and ownership.
- [x] Map closed copper regions, polygon/circular voids, and polarity
      semantics.
- [ ] Map thermal reliefs and antipads after a verified source plane/pour
      association is available; until then, diagnose every normalized entity
      instead of inventing `pcb_ground_plane` ownership.
- [x] Map keepouts and preserve unsupported restriction metadata through
      diagnostics.
- [x] Link emitted Circuit JSON IDs back to stable PADS source IDs.
- [x] Validate every emitted element against the current Circuit JSON schema.

## Loss accounting and diagnostics

- [x] Emit a stable diagnostic code for every skipped, approximated, or inferred
      source entity.
- [x] Distinguish errors from warnings and unsupported features from malformed
      input.
- [x] Include source IDs/locations and emitted Circuit JSON IDs in diagnostics.
- [x] Report parsed entity totals, converted totals, and per-section coverage.
- [x] Derive `lossless` from coverage and diagnostics; never set it manually.
- [x] Make strict mode fail on any lossy conversion.
- [x] Ensure the report is deterministic and JSON serializable.
- [x] Add tests proving that intentionally unsupported input cannot disappear
      silently.

## Fixtures and verification

- [x] Reuse the pinned PADS fixture corpus established by `padsts`.
- [x] Add `bun run test:download-assets` with pinned URLs and checksums if shared
      fixture packaging is not yet available.
- [x] Keep downloaded files and generated artifacts gitignored; commit only
      manifests, download scripts, and fixture documentation.
- [x] Cover the parser's exercised ASCII headers (`V9.4`, `V9.5`, `V10.0`,
      `V2005.0`, and `V2007.0`) and every fixed native binary container
      (`0x2021`, `0x2025`, `0x2026`, and `0x2027`). Binary fixtures assert the
      current diagnosed zero-emission boundary without claiming semantic
      conversion support.
- [x] Add exact expected Circuit JSON assertions for focused single-feature
      fixtures.
- [x] Add realistic boards with components, routes, vias, pours, cutouts, text,
      and keepouts. EMS4 supplies the dense multilayer coverage, while
      ClaySight supplies eight verified circular board cutouts.
- [x] Render each source board with the `padsts` Gerber-style SVG renderer.
- [x] Render converted Circuit JSON and compare whole-board visual snapshots.
- [x] Add board-coordinate `viewBox` zoom snapshots using `bun-match-svg` for
      pads, slots, arcs, mirrored text, via stacks, pours, and dense routing.
- [x] Inspect and document visual differences rather than accepting snapshots
      mechanically.
- [ ] Export and compare Gerbers for representative fixtures.
- [ ] Round-trip through `circuit-json-to-pads` and compare normalized semantics,
      connectivity, tolerances, and provenance.
- [x] Test malformed/truncated input, unsupported versions, invalid references,
      empty sections, extreme coordinates, hostile strings, and strict mode.

## Performance and robustness

- [x] Define memory and runtime budgets for representative large boards.
- [x] Avoid quadratic lookups when resolving parts, nets, pins, and pad stacks.
- [x] Make conversion cancellable or incrementally report progress if large
      boards require it.
- [x] Fuzz parser-to-adapter boundaries and reference resolution.
- [x] Ensure partial conversion results cannot be mistaken for lossless output.

## Documentation and release

- [x] Document supported and unsupported mappings in a compatibility table.
- [x] Add API examples for permissive and strict conversion.
- [x] Document coordinates, rotations, units, precision, and layer conventions.
- [x] Document diagnostic codes and remediation guidance.
- [x] Add contributor instructions for fixture provenance and visual snapshot
      review.
- [ ] Add release/version automation consistent with other tscircuit packages.
- [ ] Publish an initial prerelease only after the public API converts at least
      one representative PADS board end to end.
- [ ] Run the complete check suite and verify all GitHub Actions before each
      release.
