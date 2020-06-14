import vscode from "vscode";
import { BibliographicItem } from "../remarkPlugins/remarkCiteproc";
import { NameVariable } from "../../types/csl-data";

export function getCitationKeyHoverText(bibliographicItem: BibliographicItem) {
  return new vscode.MarkdownString(
    [
      `${getBibliographicItemTitleString(bibliographicItem)}`,
      ``,
      `Authors: ${getBibliographicItemAuthorString(bibliographicItem, ", ")}`,
    ].join("\n")
  );
}

export function getCitationKeyCompletionItem(
  bibliographicItem: BibliographicItem
) {
  const completionItem = new vscode.CompletionItem(
    bibliographicItem.id + "",
    vscode.CompletionItemKind.Reference
  );
  completionItem.filterText = getCitationKeyCompletionFilterText(
    bibliographicItem
  );
  completionItem.insertText = `${bibliographicItem.id}`;
  completionItem.detail = getBibliographicItemTitleString(bibliographicItem);
  completionItem.documentation = getCitationKeyCompletionDocumentation(
    bibliographicItem
  );
  return completionItem;
}

function getCitationKeyCompletionDocumentation(
  bibliographicItem: BibliographicItem
) {
  return new vscode.MarkdownString(
    `Authors: ${getBibliographicItemAuthorString(bibliographicItem, ", ")}`
  );
}

function getCitationKeyCompletionFilterText(
  bibliographicItem: BibliographicItem
) {
  return `${bibliographicItem.id} ${
    bibliographicItem.title
  } ${getBibliographicItemAuthorString(bibliographicItem)}`;
}

function getBibliographicItemTitleString(bibliographicItem: BibliographicItem) {
  // TODO(lukemurray): review other titles and determine which to use if this is undefined
  return bibliographicItem.title;
}

function getBibliographicItemAuthorString(
  bibliographicItem: BibliographicItem,
  separator: string = " "
) {
  return [
    ...(bibliographicItem.author ?? []),
    ...(bibliographicItem["container-author"] ?? []),
    ...(bibliographicItem["original-author"] ?? []),
    ...(bibliographicItem["reviewed-author"] ?? []),
  ]
    .map((v) => cslNameVariableToString(v))
    .join(separator);
}
function cslNameVariableToString(v: NameVariable) {
  return `${v["non-dropping-particle"] ?? ""} ${
    v["dropping-particle"] ?? ""
  }  ${v.given ?? ""} ${v.family ?? ""} ${v.suffix ?? ""} ${v.literal ?? ""}`;
}
