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
- [ ] Document supported PADS and Circuit JSON version ranges.
- [x] Expose `convertPadsToCircuitJson(source, options)` as the primary API.
- [x] Accept PADS text, bytes, and an already-parsed `padsts` document without
      reparsing.
- [ ] Accept readonly source documents and avoid mutating parser output.
- [ ] Stabilize the result/report schema and publish its compatibility policy.
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
- [ ] Resolve references between parts, decals, pad stacks, pins, nets, and
      routes before mapping.
- [ ] Detect dangling references and duplicate identifiers.
- [ ] Make parse and normalization failures actionable with source locations.

## Circuit JSON mapping

- [ ] Emit board metadata and a stable `pcb_board` identity.
- [ ] Map closed board outlines, line segments, circular arcs, and cutouts.
- [ ] Map the PADS layer stack to Circuit JSON layer names and ordering.
- [ ] Map component instances, reference designators, values, positions,
      rotations, and top/bottom placement.
- [ ] Map part decals to reusable footprint geometry without duplicating shared
      definitions incorrectly.
- [ ] Map SMT pad shapes, sizes, rotations, corner treatments, and layers.
- [x] Map plated/non-plated through holes, oblong drills, and slots.
- [x] Map through/blind/buried vias, diameters, drills, and layer spans.
- [ ] Map routed copper segments, widths, layers, and via transitions.
- [x] Preserve circular arcs where Circuit JSON supports them and define a
      documented segmentation tolerance otherwise.
- [ ] Map nets, pins, pad associations, and connectivity.
- [ ] Map silkscreen, fabrication, assembly, and reference/value text with
      alignment, rotation, and mirroring.
- [ ] Map copper regions, pours, voids, thermals, and polarity semantics.
- [ ] Map keepouts and supported design-rule metadata.
- [x] Link emitted Circuit JSON IDs back to stable PADS source IDs.
- [ ] Validate every emitted element against the current Circuit JSON schema.

## Loss accounting and diagnostics

- [x] Emit a stable diagnostic code for every skipped, approximated, or inferred
      source entity.
- [x] Distinguish errors from warnings and unsupported features from malformed
      input.
- [x] Include source IDs/locations and emitted Circuit JSON IDs in diagnostics.
- [ ] Report parsed entity totals, converted totals, and per-section coverage.
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
- [ ] Cover all parser-supported PADS ASCII and binary versions.
- [ ] Add exact expected Circuit JSON assertions for focused single-feature
      fixtures.
- [ ] Add realistic multilayer boards with components, routes, vias, pours,
      cutouts, text, and keepouts.
- [x] Render each source board with the `padsts` Gerber-style SVG renderer.
- [x] Render converted Circuit JSON and compare whole-board visual snapshots.
- [ ] Add board-coordinate `viewBox` zoom snapshots using `bun-match-svg` for
      pads, slots, arcs, mirrored text, via stacks, pours, and dense routing.
- [x] Inspect and document visual differences rather than accepting snapshots
      mechanically.
- [ ] Export and compare Gerbers for representative fixtures.
- [ ] Round-trip through `circuit-json-to-pads` and compare normalized semantics,
      connectivity, tolerances, and provenance.
- [ ] Test malformed/truncated input, unsupported versions, invalid references,
      extreme coordinates, and hostile strings.

## Performance and robustness

- [ ] Define memory and runtime budgets for representative large boards.
- [ ] Avoid quadratic lookups when resolving parts, nets, pins, and pad stacks.
- [ ] Make conversion cancellable or incrementally report progress if large
      boards require it.
- [ ] Fuzz parser-to-adapter boundaries and reference resolution.
- [ ] Ensure partial conversion results cannot be mistaken for lossless output.

## Documentation and release

- [ ] Document supported and unsupported mappings in a compatibility table.
- [ ] Add API examples for permissive and strict conversion.
- [ ] Document coordinates, rotations, units, precision, and layer conventions.
- [ ] Document diagnostic codes and remediation guidance.
- [ ] Add contributor instructions for fixture provenance and visual snapshot
      review.
- [ ] Add release/version automation consistent with other tscircuit packages.
- [ ] Publish an initial prerelease only after the public API converts at least
      one representative PADS board end to end.
- [ ] Run the complete check suite and verify all GitHub Actions before each
      release.
