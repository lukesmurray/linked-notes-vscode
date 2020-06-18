import { DOMParser } from "xmldom";
import { isNotNullOrUndefined } from "../utils/util";

export interface ICSLLocator {
  locatorName: string;
  single?: string;
  multiple?: string;
}

export function getLocatorsFromCSLLocale(localeXML: string): ICSLLocator[] {
  // list of valid names for locators
  /// TODO(lukemurray): might want to extract these programmatically from a schema
  const locatorNames = [
    "book",
    "chapter",
    "column",
    "figure",
    "folio",
    "issue",
    "line",
    "note",
    "opus",
    "page",
    "paragraph",
    "part",
    "section",
    "sub verbo",
    "verse",
    "volume",
  ];

  const xmlParser = new DOMParser();
  const localeDOM = xmlParser.parseFromString(localeXML, "application/xml");
  // find locator nodes
  const locatorNodes = Array.from(
    localeDOM.getElementsByTagName("term")
  ).filter((termNode) => {
    return locatorNames.some(
      (locatorName) => termNode.getAttribute("name") === locatorName
    );
  });
  // map locator nodes to ICSLLocator
  const locators: ICSLLocator[] = locatorNodes
    .map((locatorNode) => {
      const singleNode = getFirstChildWithTagName(locatorNode, "single");
      const multipleNode = getFirstChildWithTagName(locatorNode, "multiple");
      const locatorName = locatorNode.getAttribute("name");
      if (locatorName === undefined || locatorName === null) {
        return undefined;
      }
      return {
        locatorName,
        single: singleNode?.textContent ?? undefined,
        multiple: multipleNode?.textContent ?? undefined,
      };
    })
    .filter(isNotNullOrUndefined);
  return locators;
}

function getFirstChildWithTagName(
  node: Element,
  tagName: string
): Element | undefined {
  const elements = Array.from(node.getElementsByTagName(tagName));
  if (elements.length !== 0) {
    return elements[0];
  }
  return undefined;
}
