# Linked Notes VSCode

![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/lukesmurray.linked-notes-vscode)

Linked Notes VSCode is a prototype note taking system for writing notes which take advantage of bidirectional linking. There are two types of bidirectional links currently supported `[[Wikilinks]]`s and `[@citations]`.

## Quick Start

1. Open an empty directory
2. Create a new note with the [command](https://code.visualstudio.com/docs/getstarted/tips-and-tricks#_command-palette) `Linked Notes: Create New Note`.
3. Enter the title of your note. For example `hello world`
4. Try typing a wikilink in the new note. For example `[[goodbye world]]`
5. Right click on the wikilink `[[goodbye world]]` and select [Go to definition](https://code.visualstudio.com/docs/getstarted/tips-and-tricks#_go-to-definition). A new file will be created with the title `goodbye world` and the name `goodbye-world.md`.
6. In the `goodbye world` note try creating a reference to the `hello world` note with a wikilink `[[hello world]]`.
7. Now the `goodbye world` and `hello world` notes contain references to each other. You can see these references in the backlinks panel in the explorer, follow either reference using go to definition, or view [all references](https://code.visualstudio.com/docs/getstarted/tips-and-tricks#_find-all-references-view) to either wikilink.

## Features

### Create a New Note

Use the Command `Linked Notes: Create New Note`.

### Write Default Workspace Settings

Use the Command `Linked Notes: Write Default Workspace Config`

### Add Bib Support

Use the setting `linked-notes-vscode.defaultBib`. The value is a path to a CSL JSON file and is relative to the workspace root. `library.json` would resolve to `${workspaceRoot}/library.json`.

The recommended method for getting a CSL JSON file is to use the [better bib text extension](https://retorque.re/zotero-better-bibtex/) for Zotero. Set up an [automatic export](https://retorque.re/zotero-better-bibtex/exporting/auto/)to the file specified by `linked-notes-vscode.defaultBib`. Select the `keep updated` option so that future citations are automatically picked up.

### Citations In Markdown

The extension supports a subset of [markdown pandoc citeproc citation format](https://pandoc.org/MANUAL.html#citations). Specifically any citation key identified by an `@` sign followed by a `citationKey` can be used in single brackets. For example `[@ahoCorasick page 55]`. Pandoc citeproc also support citation keys in text followed by locators for example `@ahoCorasick [page 55]` but that style is not supported by this extension.

> Citations go inside square brackets and are separated by semicolons. Each citation must have a key, composed of ‘@’ + the citation identifier from the database, and may optionally have a prefix, a locator, and a suffix. The citation key must begin with a letter, digit, or _, and may contain alphanumerics, _, and internal punctuation characters (:.#\$%&-+?<>~/). Here are some examples:
>
> ```
> Blah blah [see @doe99, pp. 33-35; also @smith04, chap. 1].
> Blah blah [@doe99, pp. 33-35, 38-39 and *passim*].
> Blah blah [@smith04; @doe99].
> ```

### Special Title Behavior

The title of a note is determined by the first header with depth 1. All note created by this extension are given a title. The title has special semantics. It is used for providing autocomplete and it can be renamed. The renaming provide similar behavior to [roam](https://roamresearch.com/) where references can be renamed. If you rename a title all references to the note will be renamed, and the file will be renamed using a new slug.

### Go to Definition for Wikilinks and Citations

Will open the associated file if it exists or create a new file if the associated file does not exist.

- The wikilink file is created at the workspace root. The filename is determined by slugging the text in the wikilink. The title is the text in the wikilink.
- The citation file is created in the file specified by `linked-notes-vscode.defaultReferencesFolder`. The title is the citation key and the filename is the slugged citation key.

### Reference Provider for Wikilinks and Citations

- See all references to a file. Show all references on the title of a note to see references to the current note, or look in the backlinks panel.

### Rename Provider for Wikilinks and Titles

- Wikilinks can be renamed and all references to the wikilink, and the underlying file reference by the wikilink will reflect the new name.

### Hover Provider for Wikilinks and Citations

- Wikilinks can be hovered on to see a preview of the underlying note.
- Citations can be hovered to see the author and title information.

### Completions for Wikilinks and Citations

- Wikilinks are completed based on existing titles they are referencing
- Citations are completed based on citation keys

## Settings

<dl>
<dt>linked-notes-vscode.defaultBib</dt>
<dd>The CSL JSON file containing citation reference. Used for identifying citation keys.</dd>
<dt>linked-notes-vscode.defaultReferencesFolder</dt>
<dd>The folder where notes associated with citation keys will go. Defaults to `references`.</dd>
</dl>

## Commands

<dl>
<dt>Linked Notes: Create New Note</dt>
<dd>Create a new note with the passed in title</dd>
<dt>Linked Notes: Write Default Workspace Config</dt>
<dd>Write a workspace config with autosave. View the workspace config below.</dd>
</dl>

## Default Workspace Config

These are my workspace settings which provide a seamless save experience.

```jsonc
{
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
  "workbench.editor.enablePreviewFromQuickOpen": false
}
```

## VSCode Vim Settings

I also use the following vim key bindings which provide the illusion of transcluded documents, back links, and linked notes. In addition to the custom keybinding below I find the built in keybinding for VSCode Vim such as `gd` for go to definition, `gh` for show hover very useful. I used `gd` to jump to referenced documents creating them if needed, and `gh` to show previews or relevant information about transcluded documents.

```jsonc
  "vim.normalModeKeyBindingsNonRecursive": [
    // open references panel with gr
    {
      "before": ["g", "r"],
      "commands": ["references-view.find"]
    },
    // peek references inline with gR
    {
      "before": ["g", "R"],
      "commands": ["editor.action.referenceSearch.trigger"]
    },
    // open linked file in new editor group with gs
    {
      "before": ["g", "s"],
      "commands": ["editor.action.revealDefinitionAside"]
    },
    {
      // open linked file inline with gD
      "before": ["g", "D"],
      "commands": ["editor.action.peekDefinition"]
    },
    // open link with gx
    {
      "before": ["g", "x"],
      "commands": ["editor.action.openLink"]
    }
  ],
```

## Development and Release

To create a new release,

```sh
npm install
vsce package
vsce publish
```

To install the `vsix` locally:

1. Select Extensions `(Ctrl/Cmd + Shift + X)`
2. Open `More Action` menu (ellipsis on the top) and click `Install from VSIX…`
3. Locate VSIX file and select.
4. Reload VSCode.

OR from the command line

```sh
code --install-extension linked-notes-vscode-{VERSION}.vsix
```

## Credit

This extension was largely inspired by Andrew Kortina's [blog post](https://kortina.nyc/essays/suping-up-vs-code-as-a-markdown-notebook/) about using vscode to take markdown notes and the related extension [vscode markdown notes](https://github.com/kortina/vscode-markdown-notes). Context for backlinks was inspired by Andy Matuschak's [note-link-janitor](https://github.com/andymatuschak/note-link-janitor). The backlinks panel was inspired by b3u's [vscode-backlinks-panel](https://github.com/b3u/vscode-backlinks-panel). The work flow I adopted was inspired by Jeff Huang's [productivity text file](https://jeffhuang.com/productivity_text_file/) and Andy Matuschak's [working notes](https://notes.andymatuschak.org/About_these_notes).
