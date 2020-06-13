import { LinkedFileIdentifiable } from "./types";

export function linkedFileFsPath(
  linkedFileIdentifiable: LinkedFileIdentifiable
) {
  return linkedFileIdentifiable.fsPath;
}
