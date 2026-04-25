import { BrowserWindow } from "electrobun/bun";

new BrowserWindow({
  title: "MyShell",
  url: "views://shell/index.html",
  frame: {
    x: 120,
    y: 80,
    width: 1440,
    height: 960,
  },
});
