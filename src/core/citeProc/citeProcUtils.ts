import vscode from "vscode";
import { BibliographicItem } from "../remarkPlugins/remarkCiteproc";
import { NameVariable } from "../../types/csl-data";

export function getCitationKeyHoverText(
  bibliographicItem: BibliographicItem
): vscode.MarkdownString {
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
): vscode.CompletionItem {
  const completionItem = new vscode.CompletionItem(
    `${bibliographicItem.id}`,
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
): vscode.MarkdownString {
  return new vscode.MarkdownString(
    `Authors: ${getBibliographicItemAuthorString(bibliographicItem, ", ")}`
  );
}

function getCitationKeyCompletionFilterText(
  bibliographicItem: BibliographicItem
): string {
  return `${bibliographicItem.id} ${
    bibliographicItem.title ?? ""
  } ${getBibliographicItemAuthorString(bibliographicItem)}`;
}

function getBibliographicItemTitleString(
  bibliographicItem: BibliographicItem
): string {
  // TODO(lukemurray): review other titles and determine which to use if this is undefined
  return bibliographicItem.title ?? "No Title";
}

function getBibliographicItemAuthorString(
  bibliographicItem: BibliographicItem,
  separator: string = " "
): string {
  return [
    ...(bibliographicItem.author ?? []),
    ...(bibliographicItem["container-author"] ?? []),
    ...(bibliographicItem["original-author"] ?? []),
    ...(bibliographicItem["reviewed-author"] ?? []),
  ]
    .map((v) => cslNameVariableToString(v))
    .join(separator);
}
function cslNameVariableToString(v: NameVariable): string {
  return `${v["non-dropping-particle"] ?? ""} ${
    v["dropping-particle"] ?? ""
  }  ${v.given ?? ""} ${v.family ?? ""} ${v.suffix ?? ""} ${v.literal ?? ""}`;
}
