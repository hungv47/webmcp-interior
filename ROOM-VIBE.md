# Room vibe

This fork's judged product. Read this before changing `apps/editor/app/page.tsx` or `apps/editor/components/webmcp/`.

## Route (locked)

The page is a **showroom 1-bed**. Furniture lives in Aedifex's catalog (111 SKUs). The demo already places 50 of them. Humans decorate by asking ChatGPT. ChatGPT restyles through **named packages**, not by clicking a grid.

Warm Dusk (`pkg_warm_dusk_01`) is the first package: four evening lamps on a cloned Version B (+15 m X). More packages can use more catalog SKUs. That is how the library grows. A furniture picker on the page is a second operator and is out of this judging cycle.

The judged artifact is the **Scene Receipt** (confirm / refuse / copy / `scene.read_receipt`). The apartment is the proof.

## Stack

Not particles. Aedifex on Three.js WebGPU (`@aedifex/viewer`). Materials, lights, and the sunset theme are the look. Do not swap the renderer. Do not add an in-page agent chat. Luna has WebMCP off. Use Sol or Terra.

## Six tools

`scene.inspect` · `scene.validate_package` · `scene.apply_package` · `scene.focus_comparison` · `scene.session_state` · `scene.read_receipt`

`canCheckout` is always false. No seventh tool. No cart.

`registerTool(tool, { signal })` is the second argument (Chrome API). Do not put `signal` on the tool object.

`validate_package` only checks that the package id exists. Do not claim AABB or `expectedRevision`.

## Run

Working copy for this product is this repo (`hungv47/webmcp-interior`), branch `scene-receipt`. Not `01-business/projects/webmcp-interior/app/` (that pin stays `6a4233e3`). Do not nested-git under ipse. Do not push upstream `TangSY/aedifex`.

```
./node_modules/.bin/dotenv -e ./.env.defaults -- ./node_modules/.bin/turbo run dev --filter=editor --env-mode=loose
```

PORT 3002. Open http://127.0.0.1:3002 with no query string. Root `bun dev` / `npm run dev` dies on `@aedifex/ifc-converter`.

ChatGPT will not see site tools on localhost. Public HTTPS is a separate Hung GO (Netlify / ChatGPT Sites). Chrome `chrome://flags/#enable-webmcp-testing` proves registration locally.

## What is already true

- Full-bleed Viewer, no editor chrome.
- Camera: `FrameRoomCamera` uses the level-0 stored pose, then orbit/zoom. `camera-controls:view` is a no-op without controls and without a camera on the building node. Focus comparison emits `camera-controls:focus`.
- First-visit card key `room-vibe-onboarded-v2`. How it works stays in the header.
- Zone labels and guide gizmos off (`setShowZones(false)`, `setShowGuides(false)`). Inspect still returns Wawa Zone and Relax Zone.
- Theme `sunset` so Warm Dusk reads as evening, not studio CAD.
- Confirm modal, one `createNodes` for Version B, overlay Undo. Receipt collapse does not destroy data.
- Warm Dusk GLBs are Supabase CDN. Offline they miss. `table-lamp` is CDN-only.
- `scene.inspect` returns item names, `availablePackages`, and `catalogSkuCount`. It does not dump 111 SKUs.
- **Version A is seeded with Lived-in Interior furniture at load** (sofa, dining set, carpet, bookshelf, plant) so first paint is a furnished 1-bed, not an empty lot.
- **Next-step dock** appears after onboarding, showing: open URL in ChatGPT (Sol/Terra), copy prompt, confirm/refuse on page. Dock detects `modelContext` and guides accordingly.

## Next (Hung GO unless listed)

Do these on this branch, draft PR #2. Do not merge. Do not host.

1. **Look.** The 1-bed is a yard-and-fence plan with chairs, not a styled interior. A second named package that actually restyles furniture (not just four lamps) would make the catalog feel real. Keep six tools. Add packages in `apps/editor/lib/packages.ts`.
2. **Undo vs coach.** After Undo, coach copy must not say Version B is next door if B is gone.
3. **Hosting.** Public https before ChatGPT judging. Official cutoff Thu 3 Sep 2026 1:00pm PDT. Hung's cap Wed 2 Sep 8:00pm Vietnam.

## Demo

`DEMO.md`.
