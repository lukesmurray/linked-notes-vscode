import * as vscode from "vscode";
import MarkdownWikiLinkCompletionProvider from "./MarkdownWikiLinkCompletionProvider";
import MarkdownSnippetCompletionItemProvider from "./MarkdownSnippetCompletionItemProvider";
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
  // provide convenience snippets
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      md,
      new MarkdownSnippetCompletionItemProvider(store)
    )
  );
  // provide document links
  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider(
      md,
      new MarkdownDocumentLinkProvider(store)
    )
  );

  // Add all of the event listeners
  vscode.workspace.onDidCreateFiles((e) => {
    for (let fileUri of e.files) {
      vscode.workspace
        .openTextDocument(fileUri)
        .then(convertTextDocumentToLinkedNotesDocument)
        .then((textDoc) => {
          store.dispatch(documentAdded(textDoc));
        });
    }
  });

  vscode.workspace.onDidChangeTextDocument(async (e) => {
    store.dispatch(
      documentUpdated({
        id: getLinkedNotesDocumentIdFromTextDocument(e.document),
        changes: {
          syntaxTree: await getSyntaxTreeFromTextDocument(e.document),
        },
      })
    );
  });

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

  // initialize the workspace
  findAllMarkdownFilesInWorkspace().then((fileUris) => {
    fileUris.map((uri) =>
      vscode.workspace
        .openTextDocument(uri)
        .then(convertTextDocumentToLinkedNotesDocument)
        .then((textDoc) => {
          store.dispatch(documentAdded(textDoc));
        })
    );
  });
}
