import { BrowserView, BrowserWindow, Screen, Utils } from "electrobun/bun";
import type { ShellRPCSchema } from "./rpc";
import { startDesktopTestServer } from "./desktop-test-server";
import {
  createProjectBrowserProfile,
  launchProjectBrowserProfile,
  loadProjectBrowserProfiles,
  verifyProjectBrowserProfile,
  warmProjectBrowserProfile,
} from "./browser-profiles";
import { createProjectRuntimeBridge } from "./project-runtime";
import { createProjectTerminalBridge } from "./project-terminal";
import { loadRuntimeSettings, saveRuntimeSettings } from "./runtime-settings";
import type { ProjectRuntimeEvent } from "./runtime-types";
import type { ProjectTerminalEvent } from "./terminal-types";

const desktopTestPort = Number(process.env.FPTCLAW_DESKTOP_TEST_PORT);
const isDesktopTestMode =
  Number.isInteger(desktopTestPort) && desktopTestPort > 0;
const desktopTestProjectFolderPath = isDesktopTestMode
  ? process.env.FPTCLAW_TEST_PROJECT_FOLDER_PATH?.trim()
  : undefined;

const fallbackMainWindowFrame = {
  x: 120,
  y: 80,
  width: 1440,
  height: 960,
};

type WindowFrame = typeof fallbackMainWindowFrame;

function isValidWindowFrame(frame: WindowFrame) {
  return (
    Number.isFinite(frame.x) &&
    Number.isFinite(frame.y) &&
    Number.isFinite(frame.width) &&
    Number.isFinite(frame.height) &&
    frame.width >= 800 &&
    frame.height >= 600
  );
}

function getPrimaryDisplayWorkArea() {
  try {
    const { workArea } = Screen.getPrimaryDisplay();

    if (isValidWindowFrame(workArea)) {
      return workArea;
    }
  } catch (error) {
    console.warn("Failed to read primary display work area.", error);
  }

  return fallbackMainWindowFrame;
}

const runtimeBridge = createProjectRuntimeBridge({
  emit: emitProjectRuntimeEvent,
});
const terminalBridge = createProjectTerminalBridge({
  emit: emitProjectTerminalEvent,
});

const shellRPC = BrowserView.defineRPC<ShellRPCSchema>({
  maxRequestTime: Infinity,
  handlers: {
    requests: {
      selectProjectFolder: async ({ currentPath }) => {
        if (desktopTestProjectFolderPath) {
          return { path: desktopTestProjectFolderPath };
        }

        const selectedPaths = await Utils.openFileDialog({
          startingFolder: currentPath?.trim() || Utils.paths.home,
          canChooseFiles: false,
          canChooseDirectory: true,
          allowsMultipleSelection: false,
        });
        const path = selectedPaths.find((item) => item.trim().length > 0);

        return { path: path ?? null };
      },
      startProjectRuntimeTurn: (params) => runtimeBridge.startTurn(params),
      cancelProjectRuntimeTurn: (params) => runtimeBridge.cancelTurn(params),
      respondProjectRuntimePermission: (params) =>
        runtimeBridge.respondPermission(params),
      getProjectRuntimeStatus: () => runtimeBridge.getStatus(),
      startProjectTerminal: (params) =>
        terminalBridge.startTerminal(params),
      writeProjectTerminalInput: (params) =>
        terminalBridge.writeTerminalInput(params),
      stopProjectTerminal: (params) => terminalBridge.stopTerminal(params),
      loadProjectBrowserProfiles,
      createProjectBrowserProfile,
      verifyProjectBrowserProfile,
      warmProjectBrowserProfile,
      launchProjectBrowserProfile,
      loadRuntimeSettings,
      saveRuntimeSettings,
    },
    messages: {},
  },
});

function emitProjectRuntimeEvent(event: ProjectRuntimeEvent) {
  shellRPC.send.projectRuntimeEvent(event);
}

function emitProjectTerminalEvent(event: ProjectTerminalEvent) {
  shellRPC.send.projectTerminalEvent(event);
}

const mainWindow = new BrowserWindow({
  title: "FPTClaw",
  url: "views://shell/index.html",
  rpc: shellRPC,
  frame: getPrimaryDisplayWorkArea(),
});

const fitMainWindowToWorkArea = () => {
  const { x, y, width, height } = getPrimaryDisplayWorkArea();

  mainWindow.setFrame(x, y, width, height);
};

mainWindow.webview.on("dom-ready", fitMainWindowToWorkArea);
mainWindow.show();
fitMainWindowToWorkArea();

if (isDesktopTestMode) {
  startDesktopTestServer({
    mainWindow,
    port: desktopTestPort,
    projectFolderPath: desktopTestProjectFolderPath,
  });
}

globalThis.addEventListener?.("beforeunload", () => {
  terminalBridge.stopAll();
});

setTimeout(() => {
  // Windows work-area sizing keeps the app maximized without covering taskbar.
  fitMainWindowToWorkArea();
}, 50);
setTimeout(fitMainWindowToWorkArea, 250);
