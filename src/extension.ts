import { debounce, memoize } from "lodash";
import * as vscode from "vscode";
import ExtendMarkdownIt from "./ExtendMarkdownIt";
import MarkdownCiteProcCompletionProvider from "./MarkdownCiteProcCompletionProvider";
import MarkdownDefinitionProvider from "./MarkdownDefinitionProvider";
import MarkdownDocumentLinkProvider from "./MarkdownDocumentLinkProvider";
import MarkdownReferenceProvider from "./MarkdownReferenceProvider";
import MarkdownRenameProvider from "./MarkdownRenameProvider";
import MarkdownWikiLinkCompletionProvider from "./MarkdownWikiLinkCompletionProvider";
import {
  bibTexDocDeleted,
  convertUriToBibTexDocId,
  loadBibTexDoc,
} from "./reducers/bibTex";
import {
  convertTextDocToLinkedDoc,
  convertTextDocToLinkedDocId,
  convertUriToLinkedDocId,
  documentAdded,
  documentDeleted,
  documentUpdated,
  selectDocumentByUri,
  updateDocumentSyntaxTree,
} from "./reducers/documents";
import store from "./store";
import {
  BIB_FILE_GLOB_PATTERN,
  findAllBibFilesInWorkspace,
  findAllMarkdownFilesInWorkspace,
  isMarkdownFile,
} from "./util";

export async function activate(context: vscode.ExtensionContext) {
  const md = { scheme: "file", language: "markdown" };
  vscode.languages.setLanguageConfiguration("markdown", {
    wordPattern: /([\+\#\.\/\\\-\w]+)/,
  });

  // wiki link autocomplete
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      md,
      new MarkdownWikiLinkCompletionProvider(store),
      "["
    )
  );

  // citeproc autocomplete
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      md,
      new MarkdownCiteProcCompletionProvider(store),
      "@"
    )
  );

  // provide go to definition for links
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      md,
      new MarkdownDefinitionProvider(store)
    )
  );

  // render wiki links as links in the editor (follow link support)
  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider(
      md,
      new MarkdownDocumentLinkProvider(store)
    )
  );

  // provide link and header references
  context.subscriptions.push(
    vscode.languages.registerReferenceProvider(
      md,
      new MarkdownReferenceProvider(store)
    )
  );

  // provide renaming support
  context.subscriptions.push(
    vscode.languages.registerRenameProvider(
      md,
      new MarkdownRenameProvider(store)
    )
  );

  // initialize the workspace
  await findAllMarkdownFilesInWorkspace().then(async (fileUris) => {
    return await Promise.all([
      fileUris.map((uri) =>
        vscode.workspace
          .openTextDocument(uri)
          .then((doc) => store.dispatch(updateDocumentSyntaxTree(doc)))
      ),
    ]);
  });

  // listen for when documents are opened in the workspace
  vscode.workspace.onDidOpenTextDocument(async (e) => {
    if (isMarkdownFile(e.uri)) {
      store.dispatch(updateDocumentSyntaxTree(e));
    }
  });

  // create a memoized handler for document changes by id
  const textDocumentChangeHandler = memoize(
    (_textDocumentId: string, e: vscode.TextDocumentChangeEvent) => {
      return debounce(() => {
        if (isMarkdownFile(e.document.uri)) {
          store.dispatch(updateDocumentSyntaxTree(e.document));
        }
      }, 150);
    }
  );

  // listen for when documents are changed in the workspace
  vscode.workspace.onDidChangeTextDocument((e) => {
    if (isMarkdownFile(e.document.uri)) {
      const textDocumentId = convertTextDocToLinkedDocId(e.document);
      textDocumentChangeHandler(textDocumentId, e)();
    }
  });

  vscode.workspace.onDidRenameFiles(async (e) => {
    for (let file of e.files) {
      const oldIsMarkdown = isMarkdownFile(file.oldUri);
      const newIsMarkdown = isMarkdownFile(file.newUri);
      if (oldIsMarkdown && newIsMarkdown) {
        const oldDocument = selectDocumentByUri(store.getState(), file.oldUri);
        store.dispatch(
          documentUpdated({
            id: convertUriToLinkedDocId(file.oldUri),
            changes: {
              document: {
                ...oldDocument!.document,
                id: convertUriToLinkedDocId(file.newUri),
              },
            },
          })
        );
      } else if (oldIsMarkdown) {
        store.dispatch(documentDeleted(convertUriToLinkedDocId(file.oldUri)));
      } else if (newIsMarkdown) {
        vscode.workspace
          .openTextDocument(file.newUri)
          .then(convertTextDocToLinkedDoc)
          .then((textDoc) => {
            store.dispatch(
              documentAdded({
                document: textDoc,
                status: "up to date",
              })
            );
          });
      }
    }
  });

  vscode.workspace.onDidDeleteFiles((e) => {
    for (let fileUri of e.files) {
      store.dispatch(documentDeleted(convertUriToLinkedDocId(fileUri)));
    }
  });

  findAllBibFilesInWorkspace().then((fileUris) => {
    fileUris.map((v) => store.dispatch(loadBibTexDoc(v)));
  });

  const bibFileWatcher = vscode.workspace.createFileSystemWatcher(
    BIB_FILE_GLOB_PATTERN
  );
  bibFileWatcher.onDidChange((uri) => {
    store.dispatch(loadBibTexDoc(uri));
  });
  bibFileWatcher.onDidCreate((uri) => {
    store.dispatch(loadBibTexDoc(uri));
  });
  bibFileWatcher.onDidDelete((uri) => {
    store.dispatch(bibTexDocDeleted(convertUriToBibTexDocId(uri)));
  });

  return {
    extendMarkdownIt: ExtendMarkdownIt,
  };
}
