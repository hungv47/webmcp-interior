# Notice

This repository is a modified snapshot of [Aedifex](https://github.com/TangSY/aedifex) at commit `ebd82837a36a01d68cac9a9fd9a273d20bf5e1a1`.

Aedifex is MIT. Copyright (c) 2026 Pascal Group Inc. (https://github.com/pascalorg/editor) and Aedifex Inc. The original README is [README.aedifex.md](./README.aedifex.md). LICENSE is unchanged.

This repository is not affiliated with, endorsed by, or an official product of Aedifex Inc. or Pascal Group Inc. Do not open upstream PRs against this repository.

## Entrant work (after 2026-08-25)

WebMCP adapter, fixture apartment, and challenge docs. Paths will land under:

- `packages/core/src/webmcp/` (inspect, validate, apply, focus, session; package-clearance copy, not an `@aedifex/mcp` import)
- `apps/editor` host: `?webmcp=1` omits the AI chat tab, loads the fixture, registers tools
- `README.md`, `NOTICE.md`, `DEMO.md` (this snapshot)

Everything else is Aedifex, unchanged except as listed.

The in-page Aedifex AI assistant is not the product. WebMCP tools are for an external agent (ChatGPT in-app browser or Chrome with `enable-webmcp-testing`).
