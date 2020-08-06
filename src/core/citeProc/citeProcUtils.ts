import vscode from "vscode";
import { DateVariable, NameVariable } from "../../types/csl-data";
import { BibliographicItem } from "../remarkPlugins/remarkCiteproc";

export function getCitationKeyHoverText(
  bibliographicItem: BibliographicItem,
  includeTitle: boolean = true
): vscode.MarkdownString {
  const lines = includeTitle
    ? [`${getBibliographicItemTitleString(bibliographicItem)}`, ``]
    : [];
  lines.push(
    `Authors: ${getBibliographicItemAuthorString(bibliographicItem, ", ")}  `
  );
  const dateString = getBibliographicItemDateString(bibliographicItem);
  if (dateString !== undefined) {
    lines.push(`Date: ${dateString}  `);
  }
  if (bibliographicItem.URL !== undefined) {
    lines.push(`URL: ${bibliographicItem.URL}  `);
  }

  return new vscode.MarkdownString(lines.join("\n"));
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
  return getCitationKeyHoverText(bibliographicItem, false);
}

function getCitationKeyCompletionFilterText(
  bibliographicItem: BibliographicItem
): string {
  return `${bibliographicItem.id} ${
    bibliographicItem.title ?? ""
  } ${getBibliographicItemAuthorString(bibliographicItem)} ${
    bibliographicItem.URL ?? ""
  }`;
}

export function getBibliographicItemTitleString(
  bibliographicItem: BibliographicItem
): string {
  // TODO(lukemurray): review other titles and determine which to use if this is undefined
  return (
    bibliographicItem.title ??
    bibliographicItem["original-title"] ??
    bibliographicItem.shortTitle ??
    bibliographicItem["title-short"] ??
    bibliographicItem["reviewed-title"] ??
    `No Title - ${bibliographicItem.id}`
  );
}

function getBibliographicItemDateString(
  bibliographicItem: BibliographicItem,
  separator: string = "-"
): string | undefined {
  const dateFields = ["original-date", "issued", "submitted"] as const;
  for (const dateField of dateFields) {
    const dateString = getBibliographicItemDateFieldString(
      bibliographicItem,
      dateField,
      separator
    );
    if (dateString !== undefined) {
      return dateString;
    }
  }
  return undefined;
}

/**
 * Get the Keys in T which are of type TT
 */
type KeysOfType<T, TT> = NonNullable<
  {
    [K in keyof T]: T[K] extends TT ? K : never;
  }[keyof T]
>;

/**
 * Get the keys from the BibliographicItem which reference dates
 */
type BibliographicItemDateKey = KeysOfType<
  BibliographicItem,
  DateVariable | undefined
>;

function getBibliographicItemDateFieldString(
  bibliographicItem: BibliographicItem,
  dateField: BibliographicItemDateKey,
  separator: string
): string | undefined {
  const date = bibliographicItem[dateField];
  if (date !== undefined) {
    const dateParts = date["date-parts"];
    if (dateParts !== undefined && dateParts.length > 0) {
      return dateParts[0].join(separator);
    }
  }
  return undefined;
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
