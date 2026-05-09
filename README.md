# Appboard SDK

Official browser SDK for [Appboard](https://appboard.ai). Customers install this in their app to identify end-users and track events; Appboard then matches those events against the goals & steps configured in their dashboard and reports activation progress back.

> The SDK calls `https://api.appboard.ai/v1/*` by default. That URL is permanent — once shipped, customers will never upgrade.

## Install

```bash
npm install @appboard-ai/sdk
```

## Usage (npm / bundler)

```ts
import { Appboard } from "@appboard-ai/sdk";

Appboard.init({ projectKey: "pk_..." });

await Appboard.identify("user_123", { plan: "pro" });
await Appboard.track("chart.created", { source: "templates" });
```

## Usage (script tag)

```html
<script src="https://unpkg.com/@appboard-ai/sdk/dist/appboard.iife.js"></script>
<script>
  const { Appboard } = window.AppboardSDK;
  Appboard.init({ projectKey: "pk_..." });
  Appboard.identify("user_123");
  Appboard.track("chart.created");
</script>
```

## API

```text
Appboard.init({ projectKey: string, apiUrl?: string });
Appboard.identify(userId: string, traits?: Record<string, JsonValue>);
Appboard.track(eventName: string, props?: Record<string, JsonValue>);
Appboard.renderBoard(selector: string); // placeholder; embeddable board UI lands later
```

`apiUrl` defaults to `https://api.appboard.ai`. Override only for local development.

## Local development

Requires [Bun](https://bun.sh). The SDK uses `bun build` — no rollup/tsup/vite.

```bash
bun install
bun run build         # → dist/appboard.mjs (ESM) + dist/appboard.iife.js (browser global)
bun run typecheck
```

### Demo page

The `examples/` folder has a tiny HTML page that calls `init` / `identify` / `track` against a running Appboard api so you can verify ingestion end-to-end.

```bash
# 1. In the appboard repo: start the api on :3000
#    (cd /path/to/appboard && bun dev)
# 2. Build the SDK bundle into examples/
bun run demo:build
# 3. Serve the demo
bun run demo:serve     # → http://localhost:8080
```

Open the page, paste a `pk_*` project key, click **Init** → **identify** → any track button, then watch the events appear in the dashboard's project events view (it polls every 5s).
