import { ExtensionMetadata, LanguageKey } from "houdoku-extension-lib";

export const parseMetadata = (metadata: any): ExtensionMetadata => {
  return {
    id: metadata.id,
    name: metadata.name,
    url: metadata.url,
    version: metadata.version,
    translatedLanguage:
      metadata.translatedLanguage === ""
        ? undefined
        : (metadata.translatedLanguage as LanguageKey),
    notice: metadata.notice,
    noticeUrl: metadata.noticeUrl,
    pageLoadMessage: metadata.pageLoadMessage,
  };
};
