import DOMParser from "dom-parser";

export const findNodeWithText = (nodes: DOMParser.Node[], text: string) => {
  return nodes.find((node: DOMParser.Node) =>
    node.textContent.toLowerCase().includes(text.toLowerCase())
  );
};
