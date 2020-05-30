// Type definitions for citeproc ^2.3.22
// Project: linked-notes-vscode
// Definitions by: Luke Murray lukesmurray.com

declare module "citeproc" {
  namespace CSL {
    interface ISysInterface {
      /**
       * takes a language tag and returns a serialized locale
       */
      retrieveLocale: (tag: string) => any;

      /**
       * takes an item id and returns a CSL JSON representation of the item
       */
      retrieveItem: (id: CitationItemId) => CitationItem;
    }

    type CitationItemId = number | string;

    interface CitationItem {
      id: CitationItemId;
      type: string;
    }

    type CitationId = string;
    type NoteIndex = number;

    interface CitationCluster {
      citationItems: CitationItem[];
      properties: {
        nodeIndex: number;
      };
      citationId: CitationId;
      sortedItems: any[];
    }

    class Engine {
      constructor(sys: ISysInterface, style: string);

      updateItems(idList: (string | number)[]): void;

      updateUncitedItems(idList: (string | number)[]): void;

      processCitationCluster(
        citations: CitationCluster,
        citationsPre: [CitationId, NoteIndex][],
        citationsPost: [CitationId, NoteIndex][]
      ): void;
    }
  }
  export default CSL;
}
