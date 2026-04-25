# Runtime

This package is the runnable Bun workspace mirror of the `claude-code` reference project.

- source of truth: `claude-code/`
- mirrored into: `packages/runtime/{src,shims,vendor}`
- entrypoint: `packages/runtime/src/bootstrap-entry.ts`

Run the restored CLI from the workspace root with:

```bash
bun run claude:version
bun run claude:dev
```
