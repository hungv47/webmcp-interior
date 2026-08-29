# Room vibe

A WebMCP interior configurator on [Aedifex](https://github.com/TangSY/aedifex). An agent applies a furniture and lighting package to a live 3D apartment through WebMCP tools only. The human confirms or refuses via a page modal. A Scene Receipt records the outcome. You keep Undo. The agent never checks out.

This is a snapshot for the [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/). It is not affiliated with Aedifex or Pascal Group. Do not open upstream PRs against this repository.

Public name is not locked. Repo: `hungv47/webmcp-interior`.

## Why WebMCP

A room's object model is the scene graph (walls, items, lights, collisions), not the DOM. Clicks and screenshots cannot keep a revision, remap wall ids, or write a reversible package. This page registers six tools so an agent can:

1. Inspect the scene (Version A)
2. Validate a package (Warm Dusk)
3. Request to apply it as Version B
4. Wait for human confirmation via page modal
5. Mint a shareable Scene Receipt
6. Focus the camera on A or B

This is not photo restyle. It is not a furniture storefront. **The judged product is the Scene Receipt**, not the 3D apartment.

## Tools

| Tool | Role |
|---|---|
| `scene.inspect` | Floor plan, items, lights, selection, revision. Start here. |
| `scene.validate_package` | Check a named package. No write. |
| `scene.apply_package` | Place Version B as a sibling building on the ground. Waits for human modal confirmation. One native Undo. |
| `scene.focus_comparison` | Point the human at A or B. Does not walk. Does not buy. |
| `scene.session_state` | Who may write, what is stale. `canCheckout` is always false. |
| `scene.read_receipt` | Read the last Scene Receipt (package info, revisions, timestamp, confirmation status). |

Named package for the demo: `pkg_warm_dusk_01`.

## Run

Needs Node 20+, npm, and a Chromium 151+ browser with WebMCP (`enable-webmcp-testing`) or ChatGPT's in-app browser. WebGPU is preferred. The viewer retries WebGL2 if WebGPU is missing.

```sh
npm install
npm run dev
```

Open [http://127.0.0.1:3002/?webmcp=1](http://127.0.0.1:3002/?webmcp=1). Hard-reload once. The AI chat tab must be absent on that query. You should see a green badge "WebMCP: 6 tools registered" in the bottom right.

Base pin: Aedifex `ebd82837`. MIT. See [NOTICE.md](./NOTICE.md) and [LICENSE](./LICENSE). Upstream README: [README.aedifex.md](./README.aedifex.md).

## Demo

Paste [DEMO.md](./DEMO.md) into the agent on that tab. Expected loop:

1. Agent inspects the scene
2. Agent validates pkg_warm_dusk_01
3. Agent requests to apply it
4. Human sees page modal and can **refuse** or **confirm**
5. If refused: Scene Receipt shows "refused", no scene changes
6. If confirmed: Version B appears (offset in +X), Scene Receipt shows "confirmed by human"
7. Human can walk both rooms and compare
8. Optional: Human presses Undo to revert Version B

**The Scene Receipt is the deliverable.** It is a visible card (bottom left) and a tool-readable payload with: package id/name, revisions before/after, tools used, timestamp, agent proposed, confirmed/refused/blocked status.

## License

MIT, matching Aedifex. Corresponding source for this modified snapshot is this repository.
