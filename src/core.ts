// Core SDK: identify + track + board data. No UI.
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

export type Traits = Readonly<Record<string, JsonValue>>;
export type Props = Readonly<Record<string, JsonValue>>;

// Board model — mirrors GoalProgressDto / StepProgressDto on the api side.
// Fetched from GET /v1/boards?user_id=...
export type StepProgress = {
  readonly id: string;
  readonly name: string;
  readonly event_name: string;
  readonly completed_at: string | null;
};
export type GoalProgress = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly total_steps: number;
  readonly completed_steps: number;
  readonly steps: readonly StepProgress[];
};
export type Board = { readonly goals: readonly GoalProgress[] };

export type AppboardConfig = {
  readonly projectKey: string;
  readonly apiUrl?: string;
};

export type AppboardClient = {
  identify(userId: string, traits?: Traits): Promise<void>;
  track(eventName: string, props?: Props): Promise<void>;
  getBoard(): Promise<Board>;
};

export const createAppboard = (cfg: AppboardConfig): AppboardClient => {
  const apiUrl = (cfg.apiUrl ?? PROD_API_URL).replace(/\/$/, "");
  const { projectKey } = cfg;
  let userId: string | null = null;

  const post = async (path: string, body: unknown): Promise<Response> => {
    const res = await fetch(`${apiUrl}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${projectKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(`[Appboard] ${path} → ${res.status}`, text);
    }
    return res;
  };

  return {
    async identify(uid, traits = {}) {
      userId = uid;
      await post("/v1/identify", { user_id: uid, traits });
    },

    async track(eventName, properties = {}) {
      if (userId === null) {
        console.warn(
          `[Appboard] track() called before identify(); event dropped: ${eventName}`,
        );
        return;
      }
      await post("/v1/track", {
        user_id: userId,
        event: eventName,
        props: properties,
      });
    },

    async getBoard() {
      if (userId === null) {
        throw new Error("[Appboard] identify() must be called before getBoard()");
      }
      const url = `${apiUrl}/v1/boards?user_id=${encodeURIComponent(userId)}`;
      const res = await fetch(url, {
        headers: { authorization: `Bearer ${projectKey}` },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`[Appboard] /v1/boards → ${res.status} ${text}`);
      }
      return (await res.json()) as Board;
    },
  };
};
