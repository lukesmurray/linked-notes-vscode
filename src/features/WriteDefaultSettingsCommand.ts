import * as vscode from "vscode";
const WriteDefaultSettingsCommand = (): void => {
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
    const key = k;
    Promise.resolve(
      vscode.workspace
        .getConfiguration()
        .update(
          k,
          settings[k as keyof typeof settings],
          vscode.ConfigurationTarget.Workspace
        )
    ).catch((e) => {
      console.error(`failed to write configuration ${key}`);
    });
  });
};

export default WriteDefaultSettingsCommand;
