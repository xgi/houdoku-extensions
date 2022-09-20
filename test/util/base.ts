import { BrowserWindow } from "electron";
import { ExtensionClientAbstract, WebviewFunc } from "houdoku-extension-lib";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import { loadInWebView } from "./webview";
import { UtilFunctions } from "houdoku-extension-lib/dist/interface";

export type ExtensionEnv = {
  extensionClient: ExtensionClientAbstract;
  spoofWindow: BrowserWindow;
};

export const createExtensionEnv = (extensionClientClass: any): ExtensionEnv => {
  const docFn = (html?: string | Buffer) => new JSDOM(html).window.document;
  const spoofWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
  });
  const webviewFn: WebviewFunc = (url, options) => loadInWebView(spoofWindow, url, options);

  return {
    extensionClient: new extensionClientClass(new UtilFunctions(fetch, webviewFn, docFn)),
    spoofWindow: spoofWindow,
  };
};

export const teardownExtensionEnv = (extensionEnv: ExtensionEnv) => {
  extensionEnv.spoofWindow.destroy();
};
