# Demo script

You talk to the agent. The agent uses WebMCP. You walk the rooms and judge vibe.

## Setup

1. `bun dev` in this repository
2. Open [http://127.0.0.1:3002/?webmcp=1](http://127.0.0.1:3002/?webmcp=1) in Chrome 151 with `enable-webmcp-testing`, or in ChatGPT’s in-app browser
3. Hard-reload once
4. You should see the 1-bed+living fixture and a badge that tools are registered. No AI chat tab. If you see Aedifex’s empty editor with the AI panel, stop.

The agent must not click the 3D view.

## Script 1 — lock Warm Dusk (use this first)

```
This page is a 3D room configurator with WebMCP. Do not click the viewport. Do not checkout.

1. Inspect the live scene with scene.inspect.
2. Tell me the zones and what is already in Version A.
3. Validate package pkg_warm_dusk_01 against the current revision, then apply it.
4. Point me at Version A and Version B. I will walk both.
5. Stop. I keep Undo.
```

Pass: Version B is a second apartment on the ground, offset in +X. Version A walls and existing lamps do not move. One Undo drops B.

Fail: the agent clicking, a second storey, overwriting A, auto-checkout, or the AI chat tab.
