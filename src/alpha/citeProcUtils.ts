import vscode from "vscode";
import { BibliographicItem } from "../core/remarkPlugins/remarkCiteproc";
import { NameVariable } from "../types/csl-data";

export function createCitationKeyCompletion(
  bibliographicItem: BibliographicItem
) {
  const completionItem = new vscode.CompletionItem(
    bibliographicItem.id + "",
    vscode.CompletionItemKind.Reference
  );
  completionItem.filterText = citationKeyCompletionFilterText(
    bibliographicItem
  );
  completionItem.insertText = `${bibliographicItem.id}`;
  completionItem.detail = bibliographicItemTitleString(bibliographicItem);
  completionItem.documentation = citationKeyCompletionDocumentation(
    bibliographicItem
  );
  return completionItem;
}
function citationKeyCompletionDocumentation(
  bibliographicItem: BibliographicItem
) {
  return new vscode.MarkdownString(
    `Authors: ${bibliographicItemAuthorString(bibliographicItem, ", ")}`
  );
}
function citationKeyCompletionFilterText(bibliographicItem: BibliographicItem) {
  return `${bibliographicItem.id} ${
    bibliographicItem.title
  } ${bibliographicItemAuthorString(bibliographicItem)}`;
}

export function bibliographicItemTitleString(
  bibliographicItem: BibliographicItem
) {
  // TODO(lukemurray): review other titles and determine which to use if this is undefined
  return bibliographicItem.title;
}

export function bibliographicItemAuthorString(
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
