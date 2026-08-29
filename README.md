# Room vibe

A WebMCP interior configurator on [Aedifex](https://github.com/TangSY/aedifex). An AI agent applies lighting packages to a live 3D apartment through WebMCP tools. The human confirms or refuses via a clean modal. A Scene Receipt records every outcome.

Built for the [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/). Not affiliated with Aedifex or Pascal Group.

**Repository**: `hungv47/webmcp-interior`

## The Product

**The judged deliverable is the Scene Receipt**, not the 3D apartment. 

Room vibe is a consumer interior app where:
1. A human and AI agent share one 3D room
2. The agent can only act through named WebMCP tools (no DOM scraping/clicking)
3. Every package application waits for human approval via page modal
4. After confirmation, a shareable Scene Receipt is minted
5. One native Undo drops Version B
6. Checkout is disabled forever

The experience is a full-bleed 3D room with minimal overlay: product name, confirm/refuse modal, and a persistent Scene Receipt card. No editor chrome.

## WebMCP Tools

| Tool | Role | Read-Only |
|---|---|---|
| `scene.inspect` | Floor plan, items, lights, zones, revision | ✓ |
| `scene.validate_package` | Check a named package (no write) | |
| `scene.apply_package` | Apply package as Version B after human modal | |
| `scene.focus_comparison` | Point camera at A or B | |
| `scene.session_state` | Session state, `canCheckout` always false | ✓ |
| `scene.read_receipt` | Read the last Scene Receipt | ✓ |

**Package for demo**: `pkg_warm_dusk_01` (Warm Dusk lighting)

## How It Works

1. **Inspect**: Agent calls `scene.inspect` to understand Version A
2. **Validate**: Agent calls `scene.validate_package` with `pkg_warm_dusk_01`
3. **Propose**: Agent calls `scene.apply_package` — waits at modal
4. **Human Choice**: 
   - **Refuse** → No write, red receipt ("Refused by human"), no Version B
   - **Confirm** → Full apartment clone offset +15m in +X with Warm Dusk lamps, green receipt ("Confirmed by human"), real revisions
5. **Compare**: Agent calls `scene.focus_comparison` to point camera at A or B
6. **Receipt**: Agent calls `scene.read_receipt` to read the minted receipt
7. **Undo** (optional): Human presses native Undo to drop Version B

**Version B**: A complete walkable apartment (walls, zones, levels, Warm Dusk lamps), not just four lamps in an empty building.

## WebMCP Implementation

Tools register on **`navigator.modelContext`** (with fallback to `document.modelContext`). Each tool has:
- `execute` (async function) — not `handler`
- `annotations: { readOnly: true }` for read-only tools — not `readOnlyHint`

Visible as **Available site tools** in ChatGPT's in-app browser or Chrome with `chrome://flags/#enable-webmcp-testing`.

## Run Locally

Requires Node 20+, npm, and a WebMCP-enabled browser (Chrome 151+ with flag or ChatGPT in-app browser).

```sh
npm install
npm run dev
```

Open **http://127.0.0.1:3002** (no query string required). The demo scene loads automatically, tools register on page load.

## Scene Receipt

The **Scene Receipt** is a persistent card (bottom left) containing:
- Package ID and name
- Revisions before/after
- Tools used
- Timestamp
- Agent proposed: true
- Confirmed by: "human" | "refused" | "blocked"

**Copyable**: Click the copy icon to copy the receipt as plain text.

**Tool-readable**: `scene.read_receipt` returns the last minted receipt.

## Architecture

Built on **Aedifex** (MIT, commit `ebd82837`). Room vibe adds:
- 6 WebMCP tools (`apps/editor/components/webmcp/webmcp-tools.tsx`)
- Confirmation modal (`confirmation-modal.tsx`)
- Scene Receipt component (`scene-receipt.tsx`)
- Package definitions (`apps/editor/lib/packages.ts`)
- Hosted consumer UI (`apps/editor/app/page.tsx`)

Aedifex provides the 3D engine, scene graph, and renderer. See [NOTICE.md](./NOTICE.md) and [LICENSE](./LICENSE). Upstream README: [README.aedifex.md](./README.aedifex.md).

## Credits

- **Aedifex**: MIT 3D interior engine by Pascal Group
- **Room vibe**: WebMCP tools, Scene Receipt, hosted UI

## License

MIT, matching Aedifex. Source code for this modified snapshot is this repository.
