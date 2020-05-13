import { debounce, memoize } from "lodash";
import * as vscode from "vscode";
import ExtendMarkdownIt from "./ExtendMarkdownIt";
import MarkdownDefinitionProvider from "./MarkdownDefinitionProvider";
import MarkdownDocumentLinkProvider from "./MarkdownDocumentLinkProvider";
import MarkdownReferenceProvider from "./MarkdownReferenceProvider";
import MarkdownRenameProvider from "./MarkdownRenameProvider";
import MarkdownWikiLinkCompletionProvider from "./MarkdownWikiLinkCompletionProvider";
import {
  convertTextDocumentToLinkedNotesDocument,
  documentAdded,
  documentDeleted,
  documentUpdated,
  getLinkedNotesDocumentIdFromTextDocument,
  getLinkedNotesDocumentIdFromUri,
  updateDocumentSyntaxTree,
  selectDocumentByUri,
} from "./reducers/documents";
import store from "./store";
import { findAllMarkdownFilesInWorkspace } from "./util";

export async function activate(context: vscode.ExtensionContext) {
  const md = { scheme: "file", language: "markdown" };
  vscode.languages.setLanguageConfiguration("markdown", {
    wordPattern: /([\+\@\#\.\/\\\-\w]+)/,
  });

  // wiki link autocomplete
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      md,
      new MarkdownWikiLinkCompletionProvider(store),
      "["
    )
  );
  // provide go to definition for links
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      md,
      new MarkdownDefinitionProvider(store)
    )
  );
  // provide document links
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
  // provide renaming
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
          .then(convertTextDocumentToLinkedNotesDocument)
          .then((textDoc) => {
            store.dispatch(
              documentAdded({
                document: textDoc,
                status: "up to date",
              })
            );
          })
      ),
    ]);
  });

  // listen for when documents are opened in the workspace
  vscode.workspace.onDidOpenTextDocument(async (e) => {
    // check the list of markdown files
    const markdownFiles = await findAllMarkdownFilesInWorkspace();
    // make sure the new file is in the list
    if (new Set([...markdownFiles.map((v) => v.fsPath)]).has(e.uri.fsPath)) {
      const linkedNoteDoc = await convertTextDocumentToLinkedNotesDocument(e);
      store.dispatch(
        documentAdded({
          document: linkedNoteDoc,
          status: "up to date",
        })
      );
    }
  });

  // create a memoized handler for document changes by id
  const textDocumentChangeHandler = memoize(
    (_textDocumentId: string, e: vscode.TextDocumentChangeEvent) => {
      return debounce(
        () => {
          store.dispatch(updateDocumentSyntaxTree(e.document));
        },
        150,
        { maxWait: 15000 }
      );
    }
  );

  // listen for when documents are changed in the workspace
  vscode.workspace.onDidChangeTextDocument((e) => {
    const textDocumentId = getLinkedNotesDocumentIdFromTextDocument(e.document);
    textDocumentChangeHandler(textDocumentId, e)();
  });

  // const markdownFileWatcher = vscode.workspace.createFileSystemWatcher(
  //   MARKDOWN_FILE_GLOB_PATTERN
  // );
  // markdownFileWatcher.onDidChange((uri) => {
  //   console.log("watcher change", uri.fsPath);
  //   vscode.workspace
  //     .openTextDocument(uri)
  //     .then(convertTextDocumentToLinkedNotesDocument)
  //     .then((document) => {
  //       store.dispatch(
  //         documentUpdated({
  //           id: document.id,
  //           changes: {
  //             syntaxTree: document.syntaxTree,
  //           },
  //         })
  //       );
  //     });
  // });

  vscode.workspace.onDidRenameFiles((e) => {
    for (let file of e.files) {
      const oldDocument = selectDocumentByUri(store.getState(), file.oldUri);
      store.dispatch(
        documentUpdated({
          id: getLinkedNotesDocumentIdFromUri(file.oldUri),
          changes: {
            document: {
              ...oldDocument!.document,
              id: getLinkedNotesDocumentIdFromUri(file.newUri),
            },
          },
        })
      );
    }
  });

  vscode.workspace.onDidDeleteFiles((e) => {
    for (let fileUri of e.files) {
      store.dispatch(documentDeleted(getLinkedNotesDocumentIdFromUri(fileUri)));
    }
  });

  return {
    extendMarkdownIt: ExtendMarkdownIt,
  };
}
