import { BrowserWindow } from "electron";
import { ExtensionClientAbstract, WebviewFunc } from "houdoku-extension-lib";
import fetch from "node-fetch";
import DOMParser from "dom-parser";
import { loadInWebView } from "./webview";

export type ExtensionEnv = {
  extensionClient: ExtensionClientAbstract;
  spoofWindow: BrowserWindow;
};

export const createExtensionEnv = (extensionClientClass: any): ExtensionEnv => {
  const spoofWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
  });

  const webviewFn: WebviewFunc = (url, options) =>
    loadInWebView(spoofWindow, url, options);
  const domParser = new DOMParser();

  return {
    extensionClient: new extensionClientClass(fetch, webviewFn, domParser),
    spoofWindow: spoofWindow,
  };
};

export const teardownExtensionEnv = (extensionEnv: ExtensionEnv) => {
  extensionEnv.spoofWindow.destroy();
};
