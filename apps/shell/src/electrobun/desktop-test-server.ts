import { Utils, type BrowserWindow } from "electrobun/bun";

type DesktopEvalRequest = {
  code?: unknown;
  timeoutMs?: unknown;
};

type PendingEval = {
  resolve: (value: Response) => void;
  timeout: ReturnType<typeof setTimeout>;
};

type DesktopTestServerOptions = {
  mainWindow: BrowserWindow;
  port: number;
  projectFolderPath?: string | null;
};

const corsHeaders = {
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return Response.json(body, {
    ...init,
    headers: {
      ...corsHeaders,
      ...init.headers,
    },
  });
}

async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

function normalizeTimeout(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 5_000;
  }

  return Math.min(Math.max(value, 250), 30_000);
}

export function startDesktopTestServer({
  mainWindow,
  port,
  projectFolderPath,
}: DesktopTestServerOptions) {
  let isDomReady = false;
  const pendingEvals = new Map<string, PendingEval>();

  mainWindow.webview.on("dom-ready", () => {
    isDomReady = true;
  });

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port,
    async fetch(request) {
      const url = new URL(request.url);

      if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }

      if (request.method === "GET" && url.pathname === "/health") {
        return jsonResponse({
          ok: true,
          mode: "desktop",
          domReady: isDomReady,
          port,
          projectFolderPath: projectFolderPath ?? null,
          window: {
            id: mainWindow.id,
            frame: mainWindow.getFrame(),
            webviewId: mainWindow.webview.id,
          },
        });
      }

      if (request.method === "POST" && url.pathname === "/eval") {
        const body = await readJson<DesktopEvalRequest>(request);
        const code = typeof body?.code === "string" ? body.code : "";

        if (!code.trim()) {
          return jsonResponse(
            { ok: false, error: "Missing desktop eval code." },
            { status: 400 },
          );
        }

        const id = crypto.randomUUID();
        const timeoutMs = normalizeTimeout(body?.timeoutMs);
        const resultUrl = `http://127.0.0.1:${port}/__eval-result`;

        const responsePromise = new Promise<Response>((resolve) => {
          const timeout = setTimeout(() => {
            pendingEvals.delete(id);
            resolve(
              jsonResponse(
                {
                  ok: false,
                  error: `Desktop eval timed out after ${timeoutMs}ms.`,
                },
                { status: 504 },
              ),
            );
          }, timeoutMs);

          pendingEvals.set(id, { resolve, timeout });
        });

        const wrappedCode = `
void (async () => {
  const report = async (payload) => {
    await fetch(${JSON.stringify(resultUrl)}, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  };
  const query = (selector) => document.querySelector(selector);
  const click = (selector) => {
    const element = query(selector);
    if (!element) {
      throw new Error("Element not found: " + selector);
    }
    element.click();
    return true;
  };
  const waitFor = (predicate, timeoutMs = 5000, intervalMs = 25) =>
    new Promise((resolve, reject) => {
      const startedAt = Date.now();
      const tick = () => {
        try {
          const value = predicate();
          if (value) {
            resolve(value);
            return;
          }
        } catch (error) {
          reject(error);
          return;
        }
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error("waitFor timed out after " + timeoutMs + "ms"));
          return;
        }
        setTimeout(tick, intervalMs);
      };
      tick();
    });

  try {
    const value = await (async () => {
${code}
    })();
    await report({ id: ${JSON.stringify(id)}, ok: true, value });
  } catch (error) {
    await report({
      id: ${JSON.stringify(id)},
      ok: false,
      error: {
        name: error?.name ?? "Error",
        message: error?.message ?? String(error),
        stack: error?.stack ?? null,
      },
    });
  }
})();`;

        mainWindow.webview.executeJavascript(wrappedCode);

        return responsePromise;
      }

      if (request.method === "POST" && url.pathname === "/__eval-result") {
        const body = await readJson<{
          id?: unknown;
          ok?: unknown;
          value?: unknown;
          error?: unknown;
        }>(request);
        const id = typeof body?.id === "string" ? body.id : "";
        const pending = pendingEvals.get(id);

        if (!pending) {
          return jsonResponse(
            { ok: false, error: "Unknown desktop eval id." },
            { status: 404 },
          );
        }

        clearTimeout(pending.timeout);
        pendingEvals.delete(id);
        pending.resolve(
          jsonResponse({
            ok: body?.ok === true,
            value: body?.value ?? null,
            error: body?.error ?? null,
          }),
        );

        return jsonResponse({ ok: true });
      }

      if (request.method === "POST" && url.pathname === "/quit") {
        setTimeout(() => {
          server.stop(true);
          Utils.quit();
        }, 0);

        return jsonResponse({ ok: true });
      }

      return jsonResponse({ ok: false, error: "Not found." }, { status: 404 });
    },
  });

  console.log(`FPTClaw desktop test server listening on ${server.url}`);

  return server;
}
