import { afterEach, describe, expect, it, vi } from "vitest";
import { withFetchPreconnect } from "../../test-support.js";
import * as cdpModule from "./cdp.js";
import { BrowserCdpEndpointBlockedError } from "./errors.js";
import { createBrowserRouteContext } from "./server-context.js";
import { makeState, originalFetch } from "./server-context.remote-tab-ops.harness.js";

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("browser server-context loopback direct WebSocket profiles", () => {
  it("uses an HTTP /json/list base when opening about:blank under strict SSRF", async () => {
    const createTargetViaCdp = vi
      .spyOn(cdpModule, "createTargetViaCdp")
      .mockResolvedValue({ targetId: "CREATED" });

    const fetchMock = vi.fn(async (url: unknown) => {
      const u = String(url);
      expect(u).toBe("http://127.0.0.1:18800/json/list?token=abc");
      return {
        ok: true,
        json: async () => [
          {
            id: "CREATED",
            title: "New Tab",
            url: "about:blank",
            webSocketDebuggerUrl: "ws://127.0.0.1/devtools/page/CREATED",
            type: "page",
          },
        ],
      } as unknown as Response;
    });

    global.fetch = withFetchPreconnect(fetchMock);
    const state = makeState("skillset");
    state.resolved.ssrfPolicy = {};
    state.resolved.profiles.skillset = {
      cdpUrl: "ws://127.0.0.1:18800/devtools/browser/SESSION?token=abc",
      color: "#FF4500",
    };
    const ctx = createBrowserRouteContext({ getState: () => state });
    const skillset = ctx.forProfile("skillset");

    const opened = await skillset.openTab("about:blank");
    expect(opened.targetId).toBe("CREATED");
    expect(createTargetViaCdp).toHaveBeenCalledWith({
      cdpUrl: "ws://127.0.0.1:18800/devtools/browser/SESSION?token=abc",
      url: "about:blank",
      ssrfPolicy: undefined,
    });
  });

  it("uses an HTTP /json base for focus and close under strict SSRF", async () => {
    const fetchMock = vi.fn(async (url: unknown) => {
      const u = String(url);
      if (u === "http://127.0.0.1:18800/json/list?token=abc") {
        return {
          ok: true,
          json: async () => [
            {
              id: "T1",
              title: "Tab 1",
              url: "https://example.com",
              webSocketDebuggerUrl: "ws://127.0.0.1/devtools/page/T1",
              type: "page",
            },
          ],
        } as unknown as Response;
      }
      if (u === "http://127.0.0.1:18800/json/activate/T1?token=abc") {
        return { ok: true, json: async () => ({}) } as unknown as Response;
      }
      if (u === "http://127.0.0.1:18800/json/close/T1?token=abc") {
        return { ok: true, json: async () => ({}) } as unknown as Response;
      }
      throw new Error(`unexpected fetch: ${u}`);
    });

    global.fetch = withFetchPreconnect(fetchMock);
    const state = makeState("skillset");
    state.resolved.ssrfPolicy = {};
    state.resolved.profiles.skillset = {
      cdpUrl: "ws://127.0.0.1:18800/devtools/browser/SESSION?token=abc",
      color: "#FF4500",
    };
    const ctx = createBrowserRouteContext({ getState: () => state });
    const skillset = ctx.forProfile("skillset");

    await skillset.focusTab("T1");
    await skillset.closeTab("T1");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:18800/json/activate/T1?token=abc",
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:18800/json/close/T1?token=abc",
      expect.any(Object),
    );
  });

  it("uses an HTTPS /json base for secure direct WebSocket profiles with a /cdp suffix", async () => {
    const fetchMock = vi.fn(async (url: unknown) => {
      const u = String(url);
      if (u === "https://127.0.0.1:18800/json/list?token=abc") {
        return {
          ok: true,
          json: async () => [
            {
              id: "T2",
              title: "Secure Tab",
              url: "https://example.com",
              webSocketDebuggerUrl: "wss://127.0.0.1/devtools/page/T2",
              type: "page",
            },
          ],
        } as unknown as Response;
      }
      if (u === "https://127.0.0.1:18800/json/activate/T2?token=abc") {
        return { ok: true, json: async () => ({}) } as unknown as Response;
      }
      if (u === "https://127.0.0.1:18800/json/close/T2?token=abc") {
        return { ok: true, json: async () => ({}) } as unknown as Response;
      }
      throw new Error(`unexpected fetch: ${u}`);
    });

    global.fetch = withFetchPreconnect(fetchMock);
    const state = makeState("skillset");
    state.resolved.profiles.skillset = {
      cdpUrl: "wss://127.0.0.1:18800/cdp?token=abc",
      color: "#FF4500",
    };
    const ctx = createBrowserRouteContext({ getState: () => state });
    const skillset = ctx.forProfile("skillset");

    const tabs = await skillset.listTabs();
    expect(tabs.map((tab) => tab.targetId)).toEqual(["T2"]);

    await skillset.focusTab("T2");
    await skillset.closeTab("T2");
  });

  it("blocks direct WebSocket tab operations when strict SSRF hostname allowlist rejects the cdpUrl", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("unexpected fetch");
    });

    global.fetch = withFetchPreconnect(fetchMock);
    const state = makeState("skillset");
    state.resolved.ssrfPolicy = {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["browserless.example.com"],
    };
    state.resolved.profiles.skillset = {
      cdpUrl: "ws://10.0.0.42:18800/devtools/browser/SESSION?token=abc",
      color: "#FF4500",
    };
    const ctx = createBrowserRouteContext({ getState: () => state });
    const skillset = ctx.forProfile("skillset");

    await expect(skillset.listTabs()).rejects.toBeInstanceOf(BrowserCdpEndpointBlockedError);
    await expect(skillset.focusTab("T1")).rejects.toBeInstanceOf(BrowserCdpEndpointBlockedError);
    await expect(skillset.closeTab("T1")).rejects.toBeInstanceOf(BrowserCdpEndpointBlockedError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
