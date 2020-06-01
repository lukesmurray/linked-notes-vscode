import {
  createEntityAdapter,
  createSlice,
  createAsyncThunk,
  createAction,
  createSelector,
} from "@reduxjs/toolkit";
import * as vscode from "vscode";
import { AppDispatch } from "../store";
import { RootState } from ".";
import Cite, { CitationItem } from "citation-js";
import { getCitations } from "./citeProc";

export interface BibTexDocument {
  /**
   * see https://code.visualstudio.com/api/references/vscode-api#Uri fsPath
   * The string representing the corresponding file system path of this Uri.
   */
  id: string;
  /**
   * RUDIMENTARY representation of a CSL
   */
  csl: CitationItem[];
}

function convertBibTexDocToBibTexDocId(document: BibTexDocument) {
  return document.id;
}

export function convertUriToBibTexDocId(uri: vscode.Uri) {
  return uri.fsPath;
}

export async function convertUriToBibTexDoc(
  uri: vscode.Uri
): Promise<BibTexDocument> {
  const { csl } = await vscode.workspace.fs
    .readFile(uri)
    .then((fileBytes) => new TextDecoder("utf-8").decode(fileBytes))
    .then(async (fileString) => {
      // const ast = bibtexParser.parse(fileString);

      // create the CSL JSON object for citeproc
      const cite = new Cite(fileString, {
        forceType: "@bibtex/text",
        generateGraph: false,
        output: {
          format: "real",
          type: "json",
          style: "csl",
        },
      });
      const csl = cite.get();
      const citations = await getCitations(csl);
      return { csl };
    });
  return {
    id: convertUriToBibTexDocId(uri),
    // syntaxTree: bibTexAST,
    csl: csl,
  };
}

export const loadBibTexDoc = createAsyncThunk<
  BibTexDocument,
  vscode.Uri,
  { dispatch: AppDispatch; state: RootState }
>("bibTexDocuments/loadBibTexDoc", async (uri: vscode.Uri, thunkApi) => {
  thunkApi.dispatch(bibTexChangePending({ id: convertUriToBibTexDocId(uri) }));
  const bibTexDoc = convertUriToBibTexDoc(uri);
  return bibTexDoc;
});

export const bibTexChangePending = createAction<{ id: string }>(
  "bibTexDocuments/changePending"
);

// create adapter for managing bibtex files
const bibTexAdapter = createEntityAdapter<{
  document: BibTexDocument;
  status: "pending changes" | "up to date";
}>({
  selectId: (entity) => convertBibTexDocToBibTexDocId(entity.document),
  sortComparer: (a, b) => a.document.id.localeCompare(b.document.id),
});

// create documents slice
const bibTexSlice = createSlice({
  name: "bibTexDocuments",
  initialState: bibTexAdapter.getInitialState(),
  reducers: {
    bibTexDocAdded: bibTexAdapter.upsertOne,
    bibTexDocUpdated: bibTexAdapter.updateOne,
    bibTexDocDeleted: bibTexAdapter.removeOne,
  },
  extraReducers: (builder) => {
    builder.addCase(loadBibTexDoc.fulfilled, (state, action) => {
      return bibTexAdapter.upsertOne(state, {
        document: action.payload,
        status: "up to date",
      });
    });
    builder.addCase(bibTexChangePending, (state, action) => {
      return bibTexAdapter.updateOne(state, {
        id: action.payload.id,
        changes: {
          status: "pending changes",
        },
      });
    });
  },
});

// export actions
export const {
  bibTexDocAdded,
  bibTexDocDeleted,
  bibTexDocUpdated,
} = bibTexSlice.actions;

export const selectBibTexSlice = (state: RootState) => state.bibText;

export const {
  selectById: selectDocumentById,
  selectEntities: selectDocumentEntities,
  selectIds: selectDocumentIds,
} = bibTexAdapter.getSelectors<RootState>(selectBibTexSlice);

// export reducer as the default
export default bibTexSlice.reducer;

export const selectBibTexCompletions = createSelector(
  selectDocumentIds,
  selectDocumentEntities,
  (docIds, bibTexDocs) => {
    const allIds = docIds
      .map((v) =>
        // TODO(lukemurray): this conversion needs to be standardized based on CSL
        // current conversion of things like author field are based on heuristics
        // not necessarily always true
        bibTexDocs[v]?.document.csl.map((v) => {
          const completionItem = new vscode.CompletionItem(
            v.id,
            vscode.CompletionItemKind.Reference
          );
          completionItem.filterText = `${v.id} ${
            v.title
          } ${completionItemToAuthorString(v)}`;
          completionItem.insertText = `${v.id}`;
          completionItem.detail = `${v.title}\n${completionItemToAuthorString(
            v
          )}`;
          return completionItem;
        })
      )
      .flat() as vscode.CompletionItem[];

    return allIds;
  }
);

function completionItemToAuthorString(v: CitationItem) {
  return v.author.map((a) => `${a.given} ${a.family}`).join(" ");
}
/**
 * // TODO(lukemurray):
 * 1. convert bibtex to csl using citation.js
 *   - define types for citation js
 * 2. parse csl using citeproc-js
 * 3. display html in markdown-it
 */
