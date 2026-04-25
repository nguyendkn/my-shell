import { BrowserView, BrowserWindow, Utils } from "electrobun/bun";
import type { ShellRPCSchema } from "./rpc";
import { startDesktopTestServer } from "./desktop-test-server";

const desktopTestPort = Number(process.env.FPTCLAW_DESKTOP_TEST_PORT);
const isDesktopTestMode =
  Number.isInteger(desktopTestPort) && desktopTestPort > 0;
const desktopTestProjectFolderPath = isDesktopTestMode
  ? process.env.FPTCLAW_TEST_PROJECT_FOLDER_PATH?.trim()
  : undefined;

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
    },
    messages: {},
  },
});

const mainWindow = new BrowserWindow({
  title: "FPTClaw",
  url: "views://shell/index.html",
  rpc: shellRPC,
  frame: {
    x: 120,
    y: 80,
    width: 1440,
    height: 960,
  },
});

mainWindow.show();

if (isDesktopTestMode) {
  startDesktopTestServer({
    mainWindow,
    port: desktopTestPort,
    projectFolderPath: desktopTestProjectFolderPath,
  });
}

setTimeout(() => {
  const { width, height } = mainWindow.getFrame();

  if (height <= 1) {
    return;
  }

  // Windows WebView bounds can settle only after the native window is shown.
  mainWindow.setSize(width, height - 1);
  setTimeout(() => mainWindow.setSize(width, height), 0);
}, 50);
