import {
  createEntityAdapter,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import type { Heading, Root as mdastRoot, WikiLink } from "mdast";
import mdastNodeToString from "mdast-util-to-string";
import markdown from "remark-parse";
import wikiLinkPlugin from "remark-wiki-link";
import { createObjectSelector } from "reselect-map";
import unified from "unified";
import {
  select as unistSelect,
  selectAll as unistSelectAll,
} from "unist-util-select";
import * as vscode from "vscode";
import type { RootState } from ".";
import {
  convertUnistPositionToVscodeRange,
  getDocumentIdFromWikiLink,
} from "../util";

export interface LinkedNotesDocument {
  /**
   * see https://code.visualstudio.com/api/references/vscode-api#Uri fsPath
   * The string representing the corresponding file system path of this Uri.
   */
  id: string;
  /**
   * the mdast syntax tree representing this document
   */
  syntaxTree: mdastRoot;
}

/**
 * Create the unified markdown processor for parsing text documents and
 * creating syntax trees
 */
function createMarkdownProcessor() {
  return unified()
    .use(markdown)
    .use(wikiLinkPlugin, {
      pageResolver: (pageName) => [
        pageName
          .replace(/[^\w\s-]/g, "") // Remove non-ASCII characters
          .trim()
          .replace(/\s+/g, "-") // Convert whitespace to hyphens
          .toLocaleLowerCase(), // add the markdown extension
      ],
    });
}

/**
 * Get a syntax tree from a text document assynchronously
 * @param doc a vscode text document
 */
export async function getSyntaxTreeFromTextDocument(
  doc: vscode.TextDocument
): Promise<mdastRoot> {
  const processor = createMarkdownProcessor();
  const docText = doc.getText();
  // TODO(lukemurray): find a better way to get rid of circular references
  // since we store the syntax tree in redux we want all references to be
  // unique but the mdast shares references to things like internal arrays
  const syntaxTree = JSON.parse(
    JSON.stringify(await processor.run(processor.parse(docText)))
  ) as mdastRoot;
  return syntaxTree;
}

/**
 * Convert a vscode document to a linked notes document
 * @param doc a vscode document
 */
export function convertTextDocumentToLinkedNotesDocument(
  doc: vscode.TextDocument
): Promise<LinkedNotesDocument> {
  return getSyntaxTreeFromTextDocument(doc).then((root) => {
    return {
      id: getLinkedNotesDocumentIdFromTextDocument(doc),
      syntaxTree: root,
    };
  });
}

/**
 * Get the documents slice id from the text document.
 * @param doc the text document in the workspace
 */
export const getLinkedNotesDocumentIdFromTextDocument: (
  uri: vscode.TextDocument
) => string = (doc) => getLinkedNotesDocumentIdFromUri(doc.uri);

/**
 * Get the documents slice id from the text document uri.
 * @param uri the uri from a vscode.TextDocument
 */
export const getLinkedNotesDocumentIdFromUri: (uri: vscode.Uri) => string = (
  uri
) => uri.fsPath;

/**
 * Return the document slice id for a linked notes document
 * @param document a linked notes document
 */
export const getLinkedNotesDocumentId: (
  document: LinkedNotesDocument
) => string = (document) => document.id;

// create adapter for managing documents
const documentsAdapter = createEntityAdapter<LinkedNotesDocument>({
  selectId: getLinkedNotesDocumentId,
  sortComparer: (a, b) => a.id.localeCompare(b.id),
});

// create documents slice
const documentsSlice = createSlice({
  name: "documents",
  initialState: documentsAdapter.getInitialState(),
  reducers: {
    documentAdded: documentsAdapter.upsertOne,
    documentUpdated: documentsAdapter.updateOne,
    documentDeleted: documentsAdapter.removeOne,
  },
});

// export actions
export const {
  documentAdded,
  documentUpdated,
  documentDeleted,
} = documentsSlice.actions;

export const selectDocumentSlice = (state: RootState) => state.documents;

const {
  selectById: selectDocumentById,
  selectEntities: selectDocumentEntities,
} = documentsAdapter.getSelectors<RootState>(selectDocumentSlice);

export const selectDocumentByUri = (
  state: RootState,
  documentUri: vscode.Uri
) => selectDocumentById(state, getLinkedNotesDocumentIdFromUri(documentUri));

export const selectDocumentWikiLinksByDocumentId = createObjectSelector(
  selectDocumentEntities,
  (doc) => unistSelectAll("wikiLink", doc!.syntaxTree) as WikiLink[]
);

export const selectDocumentHeadingByDocumentId = createObjectSelector(
  selectDocumentEntities,
  (doc) =>
    (unistSelect(`heading[depth="1"]`, doc!.syntaxTree) as Heading) ?? undefined
);

const selectDocumentHeadingTextByDocumentId = createObjectSelector(
  selectDocumentHeadingByDocumentId,
  (heading) => (heading === undefined ? undefined : mdastNodeToString(heading))
);

export const selectDocumentLinksByDocumentId = createObjectSelector(
  selectDocumentWikiLinksByDocumentId,
  (allWikiLinks) =>
    allWikiLinks
      ?.filter((v) => v.position !== undefined)
      .map(
        (v) =>
          new vscode.DocumentLink(
            convertUnistPositionToVscodeRange(v.position!)
          )
      )
);

export const selectWikiLinkBackReferencesToDocumentId = createSelector(
  selectDocumentWikiLinksByDocumentId,
  (allLinks) => {
    const output: {
      [key: string]: { containingDocumentId: string; wikiLink: WikiLink }[];
    } = {};

    for (let containingDocumentId of Object.keys(allLinks)) {
      for (let wikiLink of (allLinks as { [key: string]: WikiLink[] })[
        containingDocumentId
      ]) {
        const wikiLinkReferenceDocumentId = getDocumentIdFromWikiLink(wikiLink);
        if (wikiLinkReferenceDocumentId !== undefined) {
          if (output[wikiLinkReferenceDocumentId] === undefined) {
            output[wikiLinkReferenceDocumentId] = [];
          }
          output[wikiLinkReferenceDocumentId].push({
            containingDocumentId: containingDocumentId,
            wikiLink,
          });
        }
      }
    }
    return output;
  }
);

export const selectWikiLinkCompletions = createSelector(
  selectDocumentWikiLinksByDocumentId,
  selectDocumentHeadingTextByDocumentId,
  (wikiLinksByDocumentId, headingTextByDocumentId) => {
    return [
      ...new Set([
        // the wiki link aliases
        ...Object.values(wikiLinksByDocumentId)
          .flat()
          .map((v) => v.data.alias),
        // the heading text
        ...Object.values(headingTextByDocumentId).flat(),
      ]),
    ].sort();
  }
);

// export reducer as the default
export default documentsSlice.reducer;
