import * as vscode from "vscode";
const WriteDefaultSettingsCommand = () => {
  const settings = {
    // save files after a delay automatically
    "files.autoSave": "afterDelay",
    "files.autoSaveDelay": 1000,
    // sort the explorer by modified date in descending order
    "explorer.sortOrder": "modified",
    // open files as tabs
    "workbench.editor.enablePreview": false,
    // reveal existing files if they are open (avoids tons of tabs)
    "workbench.editor.revealIfOpen": true,
    // open files from quick open as tabs
    "workbench.editor.enablePreviewFromQuickOpen": false,
  } as const;
  Object.keys(settings).forEach((k) => {
    vscode.workspace
      .getConfiguration()
      .update(
        k,
        settings[k as keyof typeof settings],
        vscode.ConfigurationTarget.Workspace
      );
  });
};

export default WriteDefaultSettingsCommand;
