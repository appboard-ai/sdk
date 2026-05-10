// Appboard browser SDK.
//
// The api URL must be configurable for local dev — but in production builds
// shipped to customers, the default points at api.appboard.ai. That URL is
// sacred (see appboard repo README): once a customer ships our SDK, we cannot
// move it. New api features must live under /v1/* on that host.

const PROD_API_URL = "https://api.appboard.ai";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { readonly [k: string]: JsonValue };
type Traits = Readonly<Record<string, JsonValue>>;
type Props = Readonly<Record<string, JsonValue>>;

// Board model — mirrors GoalProgressDto / StepProgressDto on the api side.
// Fetched from GET /v1/boards?user_id=...
type StepProgress = {
  readonly id: string;
  readonly name: string;
  readonly event_name: string;
  readonly completed_at: string | null;
};
type GoalProgress = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly total_steps: number;
  readonly completed_steps: number;
  readonly steps: readonly StepProgress[];
};
type Board = { readonly goals: readonly GoalProgress[] };

// Board styles — scoped inside Shadow DOM, so class names are local. Theming
// surface is :host CSS custom properties; customers override them by setting
// vars on the host element from their stylesheet.
const BOARD_STYLES = `
:host {
  --appboard-primary: oklch(0.52 0.22 265);
  --appboard-primary-foreground: #ffffff;
  --appboard-foreground: #111827;
  --appboard-muted: #6b7280;
  --appboard-border: #e5e7eb;
  --appboard-bg: #ffffff;
  --appboard-bg-soft: #f9fafb;
  --appboard-radius: 12px;
  --appboard-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  display: block;
  font-family: var(--appboard-font);
  color: var(--appboard-foreground);
  background: var(--appboard-bg);
  border: 1px solid var(--appboard-border);
  border-radius: var(--appboard-radius);
  padding: 16px;
  box-sizing: border-box;
}
.goal { margin-bottom: 16px; }
.goal:last-child { margin-bottom: 0; }
.header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}
.title { font-size: 14px; font-weight: 600; margin: 0; }
.description { font-size: 12px; color: var(--appboard-muted); margin: 0 0 10px; }
.progress-text {
  font-size: 12px;
  color: var(--appboard-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--appboard-bg-soft);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 12px;
}
.progress-bar-fill {
  height: 100%;
  background: var(--appboard-primary);
  border-radius: 999px;
  transition: width 200ms ease;
}
.step-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.step { display: flex; align-items: center; gap: 10px; padding: 6px 4px; font-size: 13px; }
.step-check {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: transparent;
  border: 1.5px solid var(--appboard-border);
  color: transparent;
}
.step-check.done {
  background: var(--appboard-primary);
  border-color: var(--appboard-primary);
  color: var(--appboard-primary-foreground);
}
.step-check svg { width: 10px; height: 10px; }
.step-label { flex: 1; color: var(--appboard-muted); }
.step.done .step-label { color: var(--appboard-foreground); }
.empty { color: var(--appboard-muted); font-size: 13px; margin: 0; }
`;

const CHECK_SVG =
  '<svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => {
    if (c === "&") return "&amp;";
    if (c === "<") return "&lt;";
    if (c === ">") return "&gt;";
    if (c === '"') return "&quot;";
    return "&#39;";
  });

const renderGoalHtml = (goal: GoalProgress): string => {
  const pct =
    goal.total_steps === 0 ? 0 : Math.round((goal.completed_steps / goal.total_steps) * 100);
  const stepsHtml = goal.steps
    .map((s) => {
      const done = s.completed_at !== null;
      return `<li class="step${done ? " done" : ""}"><span class="step-check${done ? " done" : ""}">${done ? CHECK_SVG : ""}</span><span class="step-label">${escapeHtml(s.name)}</span></li>`;
    })
    .join("");
  const desc = goal.description
    ? `<p class="description">${escapeHtml(goal.description)}</p>`
    : "";
  return `<section class="goal"><div class="header"><h3 class="title">${escapeHtml(goal.name)}</h3><span class="progress-text">${goal.completed_steps} / ${goal.total_steps}</span></div>${desc}<div class="progress-bar"><div class="progress-bar-fill" style="width: ${pct}%"></div></div><ul class="step-list">${stepsHtml}</ul></section>`;
};

const renderBoardInto = (root: ShadowRoot, board: Board): void => {
  const goalsHtml =
    board.goals.length === 0
      ? '<p class="empty">No goals defined yet.</p>'
      : board.goals.map(renderGoalHtml).join("");
  root.innerHTML = `<style>${BOARD_STYLES}</style>${goalsHtml}`;
};

type InitConfig = {
  readonly projectKey: string;
  readonly apiUrl?: string;
};

type Config = {
  readonly projectKey: string;
  readonly apiUrl: string;
};

let config: Config | null = null;
let currentUserId: string | null = null;

const requireConfig = (): Config => {
  if (!config) {
    throw new Error("[Appboard] init({ projectKey }) must be called first");
  }
  return config;
};

const post = async (path: string, body: unknown): Promise<Response> => {
  const cfg = requireConfig();
  const res = await fetch(`${cfg.apiUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${cfg.projectKey}`,
    },
    body: JSON.stringify(body),
    // keepalive lets the request survive page unload — critical for tracking
    // events fired right before navigation (e.g. link clicks).
    keepalive: true,
  });
  if (!res.ok) {
    // Surface the api's error body to help diagnose 4xx during integration.
    const text = await res.text().catch(() => "");
    console.warn(`[Appboard] ${path} → ${res.status}`, text);
  }
  return res;
};

export const Appboard = {
  init(cfg: InitConfig): void {
    config = {
      projectKey: cfg.projectKey,
      apiUrl: (cfg.apiUrl ?? PROD_API_URL).replace(/\/$/, ""),
    };
  },

  async identify(userId: string, traits: Traits = {}): Promise<void> {
    currentUserId = userId;
    await post("/v1/identify", { user_id: userId, traits });
  },

  async track(eventName: string, properties: Props = {}): Promise<void> {
    if (!currentUserId) {
      throw new Error("[Appboard] identify() must be called before track()");
    }
    await post("/v1/track", {
      user_id: currentUserId,
      event: eventName,
      props: properties,
    });
  },

  // Render the activation checklist into the host element. Uses a Shadow DOM
  // so customer styles can't leak into ours and ours can't leak into theirs.
  // Theming: customer overrides --appboard-* CSS custom properties on the host.
  //
  // Requires init() and identify() to have been called first. Fetches the
  // current user's progress from GET /v1/boards. Always renders something
  // (empty state on any failure) — never throws.
  async renderBoard(selector: string): Promise<void> {
    const el = document.querySelector(selector);
    if (!el) {
      console.warn(`[Appboard] container not found: ${selector}`);
      return;
    }
    if (!(el instanceof HTMLElement)) {
      console.warn(`[Appboard] container must be an HTMLElement: ${selector}`);
      return;
    }
    // attachShadow throws if already attached; reuse the existing root so
    // re-renders don't blow up and the host can be re-rendered idempotently.
    const root = el.shadowRoot ?? el.attachShadow({ mode: "open" });

    if (!config) {
      console.warn("[Appboard] init() must be called before renderBoard()");
      renderBoardInto(root, { goals: [] });
      return;
    }
    if (!currentUserId) {
      console.warn("[Appboard] identify() must be called before renderBoard()");
      renderBoardInto(root, { goals: [] });
      return;
    }

    try {
      const url = `${config.apiUrl}/v1/boards?user_id=${encodeURIComponent(currentUserId)}`;
      const res = await fetch(url, {
        headers: { authorization: `Bearer ${config.projectKey}` },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.warn(`[Appboard] /v1/boards → ${res.status}`, text);
        renderBoardInto(root, { goals: [] });
        return;
      }
      const board = (await res.json()) as Board;
      renderBoardInto(root, board);
    } catch (err) {
      console.warn("[Appboard] /v1/boards fetch failed", err);
      renderBoardInto(root, { goals: [] });
    }
  },
};

export type { InitConfig, Traits, Props };
