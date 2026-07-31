# pads-to-circuit-json

Convert PADS PCB files into Circuit JSON with source-linked diagnostics.

This repository currently contains the package scaffold and public conversion
contract. The converter itself is not implemented yet; progress and acceptance
criteria are tracked in [CHECKLIST.md](./CHECKLIST.md).

## Scope

- This package owns the PADS-to-Circuit JSON mapping and its loss report.
- [`padsts`](https://github.com/tscircuit/padsts) owns PADS parsing, document
  models, geometry, and rendering.
- [`circuit-json`](https://github.com/tscircuit/circuit-json) owns the output
  schema.
- [`circuit-json-to-pads`](https://github.com/tscircuit/circuit-json-to-pads)
  owns the reverse mapping.

Every parsed source entity must either map to Circuit JSON or appear in the
conversion report. Strict mode will eventually reject any lossy conversion.

## Development

```bash
bun install
bun run check
```

The repository follows the tscircuit handbook's vanilla TypeScript package
layout: source is published from `lib`, downloaded fixtures stay ignored, and
Bun lockfile persistence is disabled.

## License

MIT
