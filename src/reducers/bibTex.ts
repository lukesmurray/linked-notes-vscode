import { BibtexAst } from "latex-utensils/out/src/bibtex/bibtex_parser";
import {
  createEntityAdapter,
  createSlice,
  createAsyncThunk,
  createAction,
} from "@reduxjs/toolkit";
import * as vscode from "vscode";
import { bibtexParser } from "latex-utensils";
import { AppDispatch } from "../store";
import { RootState } from ".";
import Cite from "citation-js";

export interface BibTexDocument {
  /**
   * see https://code.visualstudio.com/api/references/vscode-api#Uri fsPath
   * The string representing the corresponding file system path of this Uri.
   */
  id: string;
  /**
   * the bibtex ast representing this document
   */
  syntaxTree: BibtexAst;
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
  const bibTexAST = await vscode.workspace.fs
    .readFile(uri)
    .then((fileBytes) => new TextDecoder("utf-8").decode(fileBytes))
    .then((fileString) => {
      const ast = bibtexParser.parse(fileString);
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
      console.log(csl);
      return ast;
    });
  return {
    id: convertUriToBibTexDocId(uri),
    syntaxTree: bibTexAST,
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

/**
 * // TODO(lukemurray):
 * 1. convert bibtex to csl using citation.js
 *   - define types for citation js
 * 2. parse csl using citeproc-js
 * 3. display html in markdown-it
 */
