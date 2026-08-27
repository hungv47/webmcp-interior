# Room vibe

A WebMCP interior configurator on [Aedifex](https://github.com/TangSY/aedifex). A merchant-locked furniture and lighting package lands on a live 3D apartment. You bring the agent. You walk both rooms. You keep Undo. The agent never checkouts.

This is a snapshot for the [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/). It is not affiliated with Aedifex or Pascal Group. Do not open upstream PRs against this repository.

Public name is not locked. Repo: `webmcp-interior`.

## Why WebMCP

A room’s object model is the scene graph (walls, items, lights, collisions), not the DOM. Clicks and screenshots cannot keep a revision, remap wall ids, or write a reversible package. This page registers five tools so an agent can apply a named package as Version B beside untouched Version A.

This is not photo restyle. It is not a furniture storefront. OpenAI’s showcase already has grocery carts and ateliers for that.

## Tools

| Tool | Role |
|---|---|
| `scene.inspect` | Floor plan, items, lights, selection, revision. Start here. |
| `scene.validate_package` | Check a named package. No write. |
| `scene.apply_package` | Place Version B as a sibling building on the ground. One native Undo. |
| `scene.focus_comparison` | Point the human at A or B. Does not walk. Does not buy. |
| `scene.session_state` | Who may write, what is stale. `canCheckout` is always false. |

Named package for the demo: `pkg_warm_dusk_01`.

## Run

Needs Node 20+, Bun, and a Chromium 151+ browser with WebMCP (`enable-webmcp-testing`) or ChatGPT’s in-app browser. WebGPU is preferred. The viewer retries WebGL2 if WebGPU is missing.

```sh
bun install
bun dev
```

Open [http://127.0.0.1:3002/?webmcp=1](http://127.0.0.1:3002/?webmcp=1). Hard-reload once. The AI chat tab must be absent on that query.

Base pin: Aedifex `ebd82837`. MIT. See [NOTICE.md](./NOTICE.md) and [LICENSE](./LICENSE). Upstream README: [README.aedifex.md](./README.aedifex.md).

## Demo

Paste [DEMO.md](./DEMO.md) into the agent on that tab. Expected loop: inspect, validate Warm Dusk, apply Version B beside A, you walk both, optional Undo.

## License

MIT, matching Aedifex. Corresponding source for this modified snapshot is this repository.
