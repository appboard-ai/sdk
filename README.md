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
Appboard.renderBoard(selector: string);
```

`apiUrl` defaults to `https://api.appboard.ai`. Override only for local development.

### `renderBoard(selector)`

Renders the activation checklist into the host element. Uses a Shadow DOM so the host page's styles can't leak into the widget and the widget's styles can't leak into the host.

```html
<div id="appboard-board"></div>
<script>
  Appboard.renderBoard("#appboard-board");
</script>
```

**Theming.** Override CSS custom properties on the host element from your own stylesheet:

```css
#appboard-board {
  --appboard-primary: #ff5722;
  --appboard-radius: 6px;
  --appboard-font: "Inter", sans-serif;
}
```

Available custom properties: `--appboard-primary`, `--appboard-primary-foreground`, `--appboard-foreground`, `--appboard-muted`, `--appboard-border`, `--appboard-bg`, `--appboard-bg-soft`, `--appboard-radius`, `--appboard-font`.

Currently renders mock board data; will fetch the current end-user's progress from `/v1/boards` once that api endpoint exists.

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
