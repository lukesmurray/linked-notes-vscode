import { LinkedFileIdentifiable } from "./common/types";

export function linkedFileFsPath(
  linkedFileIdentifiable: LinkedFileIdentifiable
) {
  return linkedFileIdentifiable.fsPath;
}
