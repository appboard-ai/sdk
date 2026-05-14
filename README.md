# Appboard SDK

Official browser SDK for [Appboard](https://appboard.ai). Customers install this in their app to identify end-users and track events; Appboard then matches those events against the goals & steps configured in their dashboard and reports activation progress back.

> The SDK calls `https://api.appboard.ai/v1/*` by default. That URL is permanent — once shipped, customers will never upgrade.

## Install

```bash
npm install @appboard-ai/sdk
```

## Usage (npm / bundler)

```ts
import { createAppboard } from "@appboard-ai/sdk";

const appboard = createAppboard({ projectKey: "pk_..." });

await appboard.identify("user_123", { plan: "pro" });
await appboard.track("chart.created", { source: "templates" });
```

Each `createAppboard(...)` call returns an independent instance — you can run multiple in the same page (e.g. multi-tenant hosts) without state collision.

## Usage (script tag)

```html
<script src="https://unpkg.com/@appboard-ai/sdk/dist/appboard.iife.js"></script>
<script>
  const appboard = window.Appboard.createAppboard({ projectKey: "pk_..." });
  await appboard.identify("user_123");
  await appboard.track("chart.created");
</script>
```

## API

```text
createAppboard({ projectKey: string, apiUrl?: string }): AppboardClient

AppboardClient.identify(userId: string, traits?: Record<string, JsonValue>): Promise<void>
AppboardClient.track(eventName: string, props?: Record<string, JsonValue>): Promise<void>
AppboardClient.getBoard(): Promise<Board>
```

`apiUrl` defaults to `https://api.appboard.ai`. Override only for local development.

**Failure modes.**

- `track()` called before `identify()` warns to the console and drops the event — never throws.
- `getBoard()` throws on network errors or if `identify()` hasn't been called. Callers wrap in `try/catch`.
- The optional `renderBoard()` helper (see below) catches both and always renders something.

### Board UI (optional)

The board renderer is shipped as a separate subpath so tracking-only integrations don't pay for the UI code.

```ts
import { createAppboard } from "@appboard-ai/sdk";
import { renderBoard } from "@appboard-ai/sdk/board";

const appboard = createAppboard({ projectKey: "pk_..." });
await appboard.identify("user_123");
await renderBoard(appboard, "#appboard-board");
```

Or via script tag:

```html
<div id="appboard-board"></div>
<script src="https://unpkg.com/@appboard-ai/sdk/dist/appboard.iife.js"></script>
<script>
  const { createAppboard, renderBoard } = window.Appboard;
  const appboard = createAppboard({ projectKey: "pk_..." });
  await appboard.identify("user_123");
  await renderBoard(appboard, "#appboard-board");
</script>
```

`renderBoard` is async. It fetches the current end-user's goals + step completions via `appboard.getBoard()` and renders an activation checklist into the host element. Uses a Shadow DOM so the host page's styles can't leak into the widget and vice versa. Always renders something (empty state on any failure) — never throws. Calling again on the same element re-renders into the existing Shadow DOM — safe to call after fresh `track()` calls to refresh progress.

**Headless mode.** Skip `renderBoard` entirely and render your own UI on top of the raw data:

```ts
const board = await appboard.getBoard();
// board.goals[].steps[].completed_at — render however you want
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

## Local development

Requires [Bun](https://bun.sh). The SDK uses `bun build` — no rollup/tsup/vite.

```bash
bun install
bun run build         # → dist/index.mjs (core) + dist/board.mjs (UI) + dist/appboard.iife.js (browser global)
bun run typecheck
```

### Demo page

The `examples/` folder has a tiny HTML page that calls `identify` / `track` / `renderBoard` against a running Appboard api so you can verify ingestion end-to-end.

```bash
# 1. In the appboard repo: start the api on :3000
#    (cd /path/to/appboard && bun dev)
# 2. Build the SDK bundle into examples/
bun run demo:build
# 3. Serve the demo
bun run demo:serve     # → http://localhost:8080
```

Open the page, paste a `pk_*` project key, click **Init** → **identify** → any track button, then watch the events appear in the dashboard's project events view (it polls every 5s).
