import { LinkedFileIdentifiable } from "../common/types";

export function linkedFileFsPath(
  linkedFileIdentifiable: LinkedFileIdentifiable
): string {
  return linkedFileIdentifiable.fsPath;
}
