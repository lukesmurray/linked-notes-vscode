import "abortcontroller-polyfill/dist/abortcontroller-polyfill-only";
import * as vscode from "vscode";
import ExtendMarkdownIt from "./ExtendMarkdownIt";
import MarkdownCiteProcCitationKeyCompletionProvider from "./MarkdownCiteProcCitationKeyCompletionProvider";
import MarkdownDefinitionProvider from "./MarkdownDefinitionProvider";
import MarkdownDocumentLinkProvider from "./MarkdownDocumentLinkProvider";
import MarkdownHoverProvider from "./MarkdownHoverProvider";
import MarkdownReferenceProvider from "./MarkdownReferenceProvider";
import MarkdownRenameProvider from "./MarkdownRenameProvider";
import MarkdownWikilinkCompletionProvider from "./MarkdownWikilinkCompletionProvider";
import NewNoteCommand from "./NewNoteCommand";
import { updateBibliographicItems } from "./reducers/bibliographicItems";
import {
  getConfigurationScope,
  readConfiguration,
  updateConfiguration,
} from "./reducers/configuration";
import {
  fileDeleted,
  fileRenamed,
  flagLinkedFileForUpdate,
} from "./reducers/linkedFiles";
import { uriFsPath } from "./rewrite/uriFsPath";
import store from "./store";
import {
  BIB_FILE_GLOB_PATTERN,
  findAllMarkdownFilesInWorkspace,
  isDefaultBibFile,
  isMarkdownFile,
  MarkDownDocumentSelector,
  MARKDOWN_FILE_GLOB_PATTERN,
} from "./utils/util";
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
          .then((doc) => flagLinkedFileForUpdate(store, doc))
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
      new MarkdownWikilinkCompletionProvider(store),
      "["
    )
  );

  // citeproc citation item autocomplete
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      MarkDownDocumentSelector,
      new MarkdownCiteProcCitationKeyCompletionProvider(store),
      "@"
    )
  );

  // citeproc hover provider
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      MarkDownDocumentSelector,
      new MarkdownHoverProvider(store)
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
      flagLinkedFileForUpdate(store, e);
    }
  });

  // listen for when documents are changed in the workspace
  vscode.workspace.onDidChangeTextDocument((e) => {
    if (isMarkdownFile(e.document.uri)) {
      flagLinkedFileForUpdate(store, e.document);
    } else if (isDefaultBibFile(e.document.uri, store.getState())) {
      store.dispatch(updateBibliographicItems());
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
        store.dispatch(
          fileRenamed({
            id: uriFsPath(file.oldUri),
            changes: {
              fsPath: uriFsPath(file.newUri),
            },
          })
        );
      } else if (oldIsMarkdown) {
        store.dispatch(fileDeleted(uriFsPath(file.oldUri)));
      } else if (newIsMarkdown) {
        vscode.workspace.openTextDocument(file.newUri).then((doc) => {
          flagLinkedFileForUpdate(store, doc);
        });
      } else if (isDefaultBibFile(file.oldUri, store.getState())) {
        store.dispatch(updateBibliographicItems());
      } else if (isDefaultBibFile(file.newUri, store.getState())) {
        store.dispatch(updateBibliographicItems());
      }
    }
  });

  vscode.workspace.onDidDeleteFiles((e) => {
    for (let fileUri of e.files) {
      if (isMarkdownFile(fileUri)) {
        store.dispatch(fileDeleted(uriFsPath(fileUri)));
      } else if (isDefaultBibFile(fileUri, store.getState())) {
        store.dispatch(updateBibliographicItems());
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
      store.dispatch(updateBibliographicItems());
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
      store.dispatch(fileDeleted(uriFsPath(uri)));
    }
  };
  const markdownFileWatchUpdateHandler = async (
    uri: vscode.Uri
  ): Promise<void> => {
    if (isMarkdownFile(uri)) {
      await vscode.workspace.openTextDocument(uri).then((doc) => {
        flagLinkedFileForUpdate(store, doc);
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
