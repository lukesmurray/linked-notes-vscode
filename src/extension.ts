import { debounce, memoize } from "lodash";
import * as vscode from "vscode";
import ExtendMarkdownIt from "./ExtendMarkdownIt";
import MarkdownCiteProcCitationItemCompletionProvider from "./MarkdownCiteProcCitationItemCompletionProvider";
import MarkdownDefinitionProvider from "./MarkdownDefinitionProvider";
import MarkdownDocumentLinkProvider from "./MarkdownDocumentLinkProvider";
import MarkdownReferenceProvider from "./MarkdownReferenceProvider";
import MarkdownRenameProvider from "./MarkdownRenameProvider";
import MarkdownWikiLinkCompletionProvider from "./MarkdownWikiLinkCompletionProvider";
import NewNoteCommand from "./NewNoteCommand";
import { updateCitationItems } from "./reducers/citationItems";
import { updateConfiguration } from "./reducers/configuration";
import {
  convertTextDocToLinkedDocId,
  convertUriToLinkedDocId,
  documentDeleted,
  documentUpdated,
  selectDocumentByUri,
  updateDocumentSyntaxTree,
} from "./reducers/documents";
import store from "./store";
import {
  BIB_FILE_GLOB_PATTERN,
  findAllMarkdownFilesInWorkspace,
  getConfigurationScope,
  isDefaultBibFile,
  isMarkdownFile,
  MarkDownDocumentSelector,
  MARKDOWN_FILE_GLOB_PATTERN,
  readConfiguration,
} from "./util";
import WriteDefaultSettingsCommand from "./WriteDefaultSettingsCommand";

export async function activate(context: vscode.ExtensionContext) {
  /*****************************************************************************
   * Initialize
   ****************************************************************************/

  // read the user configuration
  store.dispatch(updateConfiguration(readConfiguration()));

  // set the language
  vscode.languages.setLanguageConfiguration("markdown", {
    wordPattern: /([\+\#\.\/\\\-\w]+)/,
  });

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

  /*****************************************************************************
   * Features
   ****************************************************************************/

  // wiki link autocomplete
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      MarkDownDocumentSelector,
      new MarkdownWikiLinkCompletionProvider(store),
      "["
    )
  );

  // citeproc citation item autocomplete
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      MarkDownDocumentSelector,
      new MarkdownCiteProcCitationItemCompletionProvider(store),
      "@"
    )
  );

  // go to definition for wikilinks
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      MarkDownDocumentSelector,
      new MarkdownDefinitionProvider(store)
    )
  );

  // document link decoration for wikilinks
  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider(
      MarkDownDocumentSelector,
      new MarkdownDocumentLinkProvider(store)
    )
  );

  // references for wikilinks and headers
  context.subscriptions.push(
    vscode.languages.registerReferenceProvider(
      MarkDownDocumentSelector,
      new MarkdownReferenceProvider(store)
    )
  );

  // renaming for wikilinks and headers
  context.subscriptions.push(
    vscode.languages.registerRenameProvider(
      MarkDownDocumentSelector,
      new MarkdownRenameProvider(store)
    )
  );

  // write default settings command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "linked-notes-vscode.defaultWorkspaceConfig",
      WriteDefaultSettingsCommand
    )
  );

  // new note command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "linked-notes-vscode.newNote",
      NewNoteCommand
    )
  );

  /*****************************************************************************
   * Workspace Document and Configuration Change Handlers
   ****************************************************************************/

  // register a configuration change listener
  vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration(getConfigurationScope())) {
      store.dispatch(updateConfiguration(readConfiguration()));
    }
  });

  // listen for when documents are opened in the workspace
  vscode.workspace.onDidOpenTextDocument(async (e) => {
    if (isMarkdownFile(e.uri)) {
      store.dispatch(updateDocumentSyntaxTree(e));
    }
  });

  // TODO(lukemurray): consider changing this to a set of documents which are pending
  // create a memoized handler for document changes by id
  const textDocumentChangeHandler = memoize(
    (_textDocumentId: string, e: vscode.TextDocumentChangeEvent) => {
      return debounce(() => {
        if (isMarkdownFile(e.document.uri)) {
          store.dispatch(updateDocumentSyntaxTree(e.document));
        }
      }, 1000);
    }
  );

  // listen for when documents are changed in the workspace
  vscode.workspace.onDidChangeTextDocument((e) => {
    if (isMarkdownFile(e.document.uri)) {
      const textDocumentId = convertTextDocToLinkedDocId(e.document);
      textDocumentChangeHandler(textDocumentId, e)();
    } else if (isDefaultBibFile(e.document.uri, store.getState())) {
      store.dispatch(updateCitationItems());
    }
  });

  vscode.workspace.onDidRenameFiles(async (e) => {
    // various cases depending on if we're renaming from markdown to markdown,
    // non markdown to markdown, or markdown to non markdown
    // this extension manages markdown files
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
        vscode.workspace.openTextDocument(file.newUri).then((doc) => {
          store.dispatch(updateDocumentSyntaxTree(doc));
        });
      } else if (isDefaultBibFile(file.oldUri, store.getState())) {
        store.dispatch(updateCitationItems());
      } else if (isDefaultBibFile(file.newUri, store.getState())) {
        store.dispatch(updateCitationItems());
      }
    }
  });

  vscode.workspace.onDidDeleteFiles((e) => {
    for (let fileUri of e.files) {
      if (isMarkdownFile(fileUri)) {
        store.dispatch(documentDeleted(convertUriToLinkedDocId(fileUri)));
      } else if (isDefaultBibFile(fileUri, store.getState())) {
        store.dispatch(updateCitationItems());
      }
    }
  });

  /*****************************************************************************
   * Workspace File Watchers
   ****************************************************************************/

  // watch bib files
  const bibFileWatcher = vscode.workspace.createFileSystemWatcher(
    BIB_FILE_GLOB_PATTERN
  );
  const bibFileWatcherHandler = (uri: vscode.Uri): void => {
    if (isDefaultBibFile(uri, store.getState())) {
      store.dispatch(updateCitationItems());
    }
  };
  bibFileWatcher.onDidChange(bibFileWatcherHandler);
  bibFileWatcher.onDidCreate(bibFileWatcherHandler);
  bibFileWatcher.onDidDelete(bibFileWatcherHandler);

  // watch markdown files
  const markdownFileWatcher = vscode.workspace.createFileSystemWatcher(
    MARKDOWN_FILE_GLOB_PATTERN
  );
  const markdownFileWatchDeleteHandler = async (
    uri: vscode.Uri
  ): Promise<void> => {
    if (isMarkdownFile(uri)) {
      store.dispatch(documentDeleted(convertUriToLinkedDocId(uri)));
    }
  };
  const markdownFileWatchUpdateHandler = async (
    uri: vscode.Uri
  ): Promise<void> => {
    if (isMarkdownFile(uri)) {
      await vscode.workspace.openTextDocument(uri).then((doc) => {
        store.dispatch(updateDocumentSyntaxTree(doc));
      });
    }
  };
  markdownFileWatcher.onDidChange(markdownFileWatchUpdateHandler);
  markdownFileWatcher.onDidCreate(markdownFileWatchUpdateHandler);
  markdownFileWatcher.onDidDelete(markdownFileWatchDeleteHandler);

  /*****************************************************************************
   * Extend Markdown
   ****************************************************************************/
  return {
    extendMarkdownIt: ExtendMarkdownIt,
  };
}
