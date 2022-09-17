export const findElementWithText = (elements: HTMLCollectionOf<Element>, text: string) => {
  return Array.from(elements).find((element: Element) =>
    element.textContent.toLowerCase().includes(text.toLowerCase())
  );
};
