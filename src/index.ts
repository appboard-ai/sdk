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

  // Placeholder for the embeddable onboarding board — real implementation
  // lands once the goal-builder UI is in place on the dashboard side.
  renderBoard(selector: string): void {
    const el = document.querySelector(selector);
    if (!el) {
      console.warn(`[Appboard] container not found: ${selector}`);
      return;
    }
    el.innerHTML = `
      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;font-family:sans-serif;">
        <strong>Appboard setup</strong>
        <p style="margin:8px 0 0;color:#6b7280;">SDK installed. Board UI coming soon.</p>
      </div>
    `;
  },
};

export type { InitConfig, Traits, Props };
