import * as vscode from "vscode";
import MarkdownWikiLinkCompletionProvider from "./MarkdownWikiLinkCompletionProvider";
import store from "./store";
import { findAllMarkdownFilesInWorkspace } from "./util";
import {
  documentAdded,
  getLinkedNotesDocumentIdFromUri,
  documentUpdated,
  documentDeleted,
  convertTextDocumentToLinkedNotesDocument,
  getLinkedNotesDocumentIdFromTextDocument,
  getSyntaxTreeFromTextDocument,
} from "./reducers/documents";
import MarkdownDocumentLinkProvider from "./MarkdownDocumentLinkProvider";
import MarkdownDefinitionProvider from "./MarkdownDefinitionProvider";
import { debounce } from "lodash";
import MarkdownReferenceProvider from "./MarkdownReferenceProvider";

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
  // provide go to definition
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
  // provide document references
  context.subscriptions.push(
    vscode.languages.registerReferenceProvider(
      md,
      new MarkdownReferenceProvider(store)
    )
  );

  // initialize the workspace
  await findAllMarkdownFilesInWorkspace().then((fileUris) => {
    fileUris.map((uri) =>
      vscode.workspace
        .openTextDocument(uri)
        .then(convertTextDocumentToLinkedNotesDocument)
        .then((textDoc) => {
          store.dispatch(documentAdded(textDoc));
        })
    );
  });

  // listen for when documents are opened in the workspace
  vscode.workspace.onDidOpenTextDocument(async (e) => {
    // check the list of markdown files
    const markdownFiles = await findAllMarkdownFilesInWorkspace();
    // make sure the new file is in the list
    if (new Set([...markdownFiles.map((v) => v.fsPath)]).has(e.uri.fsPath)) {
      const linkedNoteDoc = await convertTextDocumentToLinkedNotesDocument(e);
      store.dispatch(documentAdded(linkedNoteDoc));
    }
  });

  // listen for when documents are changed in the workspace
  vscode.workspace.onDidChangeTextDocument(
    debounce(
      async (e) => {
        store.dispatch(
          documentUpdated({
            id: getLinkedNotesDocumentIdFromTextDocument(e.document),
            changes: {
              syntaxTree: await getSyntaxTreeFromTextDocument(e.document),
            },
          })
        );
      },
      150,
      { maxWait: 15000 }
    )
  );

  vscode.workspace.onDidRenameFiles((e) => {
    for (let file of e.files) {
      store.dispatch(
        documentUpdated({
          id: getLinkedNotesDocumentIdFromUri(file.oldUri),
          changes: {
            id: getLinkedNotesDocumentIdFromUri(file.newUri),
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
}
