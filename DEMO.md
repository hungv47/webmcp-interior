# Demo Script

Test Room vibe's Scene Receipt system in ChatGPT's in-app browser or Chrome 151+ with WebMCP flag.

**The judged product is the Scene Receipt**, not the 3D apartment. The script below tests refuse, confirm, and receipt flows. Never open the tape on the pretty room as the product.

## Setup

1. `npm install && npm run dev` in this repository
2. Open **http://127.0.0.1:3002** (no query string required)
3. Hard-reload once
4. You should see:
   - 3D room (1-bed apartment) - this is the substrate, not the product
   - "Room vibe" text top left
   - Undo button top right (disabled until a change)
   - **First visit**: A card overlays the room with three short lines about ChatGPT → confirm → receipt. Click "Got it" or "Skip" to dismiss. It remembers and won't show again.
   - **Coach line** (bottom left): Changes based on state — waiting for inspect, ask to apply, confirm on page, receipt stays.
   - No editor sidebar, no AI tab, no blank canvas message

**Tools visible**: In ChatGPT, check for "Available site tools" — should show 6 scene tools.

## Script 1: Refuse Flow (Test the modal, test the red receipt)

Paste this into ChatGPT:

```
This is Room vibe, a Scene Receipt demo. Do not click the viewport. Do not checkout.

1. Use scene.inspect to tell me about the current apartment (Version A).
2. Validate the pkg_warm_dusk_01 package.
3. Apply it using scene.apply_package.
4. Wait for me to respond to the modal.
```

**Expected**:
- Agent calls `scene.inspect` and `scene.validate_package`
- Agent calls `scene.apply_package`
- A dark modal appears: "Apply Warm Dusk?"
- **Click Refuse**
- Agent receives `{ success: false, reason: 'refused' }`
- **Scene Receipt card** appears bottom left:
  - Package: Warm Dusk (pkg_warm_dusk_01)
  - Revision: X → N/A
  - Status: "Refused by human" (red)
  - Copyable (click copy icon)
- No Version B in the scene
- Apartment unchanged

**Pass**: Receipt shows "Refused by human", no Version B, apartment unchanged. The receipt is the product.

## Script 2: Confirm Flow (Test the green receipt, test Version B proof, test Undo)

Refresh the page and paste:

```
This is Room vibe, a Scene Receipt demo. Do not click the viewport. Do not checkout.

1. Inspect the scene with scene.inspect and tell me the zones.
2. Validate pkg_warm_dusk_01 with scene.validate_package.
3. Apply it with scene.apply_package.
4. After I confirm, use scene.focus_comparison to show me Version A, then Version B.
5. Read the Scene Receipt with scene.read_receipt.
6. Stop. I'll test Undo myself.
```

**Expected**:
- Agent calls `scene.inspect` and `scene.validate_package`
- Agent calls `scene.apply_package`
- Dark modal appears
- **Click Confirm**
- Agent receives `{ success: true, revisionBefore: X, revisionAfter: Y, nodesCloned: N }`
- **Version B appears**: A second complete apartment offset +15m in +X with Warm Dusk lamps (floor lamps, table lamp, ceiling lamp)
- **Scene Receipt card** appears:
  - Package: Warm Dusk (pkg_warm_dusk_01)
  - Revision: X → Y (real revisions)
  - Status: "Confirmed by human" (green)
  - Copyable
- Agent calls `scene.focus_comparison` with "A" → camera points at original apartment
- Agent calls `scene.focus_comparison` with "B" → camera points at new apartment with lamps
- Agent calls `scene.read_receipt` → reads and narrates the receipt
- You can walk both apartments (use mouse to navigate)
- **Click Undo button (top right)** → Version B disappears, receipt stays

**Pass**:
- Receipt shows "Confirmed by human" with real before/after revisions
- Version B is a **full apartment** (walls, rooms, furniture, + Warm Dusk lamps) - this is the proof on screen
- Focus comparison moves the camera
- Undo drops Version B
- **The receipt persists and is copyable** - this is what you keep

## What's Being Judged

**The Scene Receipt** is the product:
- Persistent card (doesn't auto-dismiss)
- Copyable as plain text
- Tool-readable via `scene.read_receipt`
- Contains: package id/name, revisions before/after, tools used, timestamp, agent proposed, confirmed by human/refused/blocked

The 3D apartment is inherited from Aedifex (see [README.aedifex.md](./README.aedifex.md)). Room vibe contributes the WebMCP tools, modal gate, and Scene Receipt. The second building is the proof. The receipt is what you keep.

## Failure Modes

**Fail if**:
- Agent clicks the 3D viewport (should only use tools)
- Agent calls checkout (not allowed)
- Editor sidebar is visible (should be hidden)
- AI chat tab is visible (should be hidden)
- `?webmcp=1` required to see tools (should work without query string)
- `apply_package` writes without showing the modal
- Version B is just lamps with no walls/rooms (should be full apartment)
- Receipt doesn't appear or auto-dismisses
- Receipt is not copyable
- Focus comparison doesn't move the camera
- Undo doesn't drop Version B
- Tools don't appear if ChatGPT injects modelContext late (should poll/retry)

## WebMCP Notes

- Tools registered on `document.modelContext` (fallback to `navigator.modelContext`, deprecated in Chromium 150)
- Each tool has `execute` (async), not `handler`
- Read-only tools have `annotations: { readOnlyHint: true }`
- Works in ChatGPT in-app browser (Sol/Terra) and Chrome 151+ with `enable-webmcp-testing` flag
- **Note**: Luna model has WebMCP disabled; use Sol or Terra for testing
- Registration polls indefinitely (500ms interval) until modelContext injection — ChatGPT may inject late
