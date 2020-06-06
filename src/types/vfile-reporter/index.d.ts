// Type definitions for vfile-reporter ^6.0.1
// Project: linked-notes-vscode
// Definitions by: Luke Murray lukesmurray.com

declare module "vfile-reporter" {
  import type { VFile } from "vfile";
  interface VfileReporterOptions {
    verbose?: boolean;
    quiet?: boolean;
    silent?: boolean;
    color?: boolean;
    defaultName?: string;
  }
  function reporter(
    files: VFile | VFile[] | Error,
    options?: VfileReporterOptions
  ): string;
  export default reporter;
}
