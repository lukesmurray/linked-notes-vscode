import { PartialLinkedNoteStore } from "../../store";
import { selectBibliographicItemsById } from "../../reducers/bibliographicItems";
import { BibliographicId } from "../remarkPlugins/remarkCiteproc";
import { CslData } from "../../types/csl-data";

export function bibliographicItemBibliographicId(
  store: PartialLinkedNoteStore,
  id: BibliographicId
): CslData[number] | undefined {
  return selectBibliographicItemsById(store.getState())[id];
}
