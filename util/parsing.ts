import { LanguageKey, Languages } from "houdoku-extension-lib";

export const findElementWithText = (elements: HTMLCollectionOf<Element>, text: string) => {
  return Array.from(elements).find((element: Element) =>
    element.textContent.toLowerCase().includes(text.toLowerCase())
  );
};

export const findLanguageKey = (iso639_1: string): LanguageKey | undefined => {
  return Object.values(Languages).find((language) => iso639_1.toLowerCase() === language.iso639_1)
    ?.key;
};
