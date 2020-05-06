import { debounce } from "lodash";
import MarkdownIt from "markdown-it";
import markdownItRegex, { MarkdownItRegexOptions } from "markdown-it-regex";
import * as vscode from "vscode";
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
  getSyntaxTreeFromTextDocument,
} from "./reducers/documents";
import store from "./store";
import {
  findAllMarkdownFilesInWorkspace,
  getDocumentUriFromDocumentSlug,
  sluggifyDocumentReference,
} from "./util";

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

  return {
    extendMarkdownIt(md: MarkdownIt) {
      return md.use(markdownItRegex, {
        name: "wikiLink",
        regex: /\[\[(.+?)\]\]/,
        replace: (match) => {
          const alias = match;
          const uri = getDocumentUriFromDocumentSlug(
            sluggifyDocumentReference(match)
          )!;
          return `<a href=${uri.fsPath}>${alias}</a>`;
        },
      } as MarkdownItRegexOptions);
    },
  };
}
