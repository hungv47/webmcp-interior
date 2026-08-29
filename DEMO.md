# Demo script

You talk to the agent. The agent uses WebMCP. You approve or refuse. A Scene Receipt proves the outcome.

## Setup

1. `npm install` and `npm run dev` in this repository
2. Open [http://127.0.0.1:3002/?webmcp=1](http://127.0.0.1:3002/?webmcp=1) in Chrome 151 with `enable-webmcp-testing`, or in ChatGPT's in-app browser
3. Hard-reload once
4. You should see the 1-bed+living fixture and a green badge "WebMCP: 6 tools registered" in the bottom right. No AI chat tab. If you see Aedifex's empty editor with the AI panel, stop and check the URL.

The agent must not click the 3D view. The agent must not checkout.

## Script 1 — Human refuses (try this first to see the receipt)

```
This page is a 3D room configurator with WebMCP. Do not click the viewport. Do not checkout.

1. Inspect the live scene with scene.inspect.
2. Tell me the zones and what is already in Version A.
3. Validate package pkg_warm_dusk_01, then apply it.
4. Stop after I respond to the modal.
```

**Expected flow:**
- Agent calls `scene.inspect` and `scene.validate_package`
- Agent calls `scene.apply_package`
- A page modal appears with "Confirm" and "Refuse" buttons
- **Click Refuse**
- Agent receives a response: `{ success: false, reason: 'refused' }`
- A **Scene Receipt card** appears in the bottom left showing:
  - Package: Warm Dusk (pkg_warm_dusk_01)
  - Revision: unchanged
  - Status: "Refused by human" (red)
  - Timestamp

**Pass criteria:** The receipt shows "Refused by human" and no Version B appears.

## Script 2 — Human confirms (the happy path)

Refresh the page and run:

```
This page is a 3D room configurator with WebMCP. Do not click the viewport. Do not checkout.

1. Inspect the live scene with scene.inspect.
2. Validate package pkg_warm_dusk_01 against the current revision, then apply it.
3. After I confirm, use scene.focus_comparison to point me at Version A, then Version B.
4. Read the Scene Receipt with scene.read_receipt and tell me what it says.
5. Stop. I keep Undo.
```

**Expected flow:**
- Agent calls `scene.inspect` and `scene.validate_package`
- Agent calls `scene.apply_package`
- A page modal appears
- **Click Confirm**
- Agent receives `{ success: true, revisionBefore: X, revisionAfter: Y }`
- A **Scene Receipt card** appears showing:
  - Package: Warm Dusk (pkg_warm_dusk_01)
  - Revision: X → Y
  - Status: "Confirmed by human" (green)
  - Timestamp
- Agent calls `scene.focus_comparison` with version "A", then "B"
- Agent calls `scene.read_receipt` and narrates the receipt
- Version B is a second apartment on the ground, offset in +X
- Version A walls and existing items do not move
- You can press Undo (native Aedifex Undo) to drop Version B

**Pass criteria:**
- The receipt shows "Confirmed by human" with before/after revisions
- Version B appears as a sibling building offset in +X
- Version A is untouched
- One native Undo reverts the change

## What is being judged

The **Scene Receipt** is the product. It is:
1. A visible card (bottom left of the screen) that persists after the agent's turn
2. A tool-readable payload via `scene.read_receipt`
3. Contains: package id/name, revisions before/after, tools used, timestamp, agentProposed=true, confirmedBy: "human" | "refused" | "blocked"

The 3D apartment is inherited from Aedifex (see [README.aedifex.md](./README.aedifex.md)). The WebMCP tools and receipt are this repo's contribution.

## Failure modes

**Fail if:**
- The agent clicks the 3D viewport
- The agent calls checkout
- The AI chat tab is visible (means webmcp=1 didn't work)
- apply_package writes without showing the modal
- The receipt doesn't appear
- Version B overwrites Version A
