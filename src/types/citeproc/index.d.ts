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
        nodeIndex?: number;
      };
      citationID?: CitationId;
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

      makeBibliography(): [
        {
          maxoffset: number;
          entryspacing: number;
          linespacing: number;
          hangingindent: boolean;
          ["second-field-align"]: boolean;
          bibstart: string;
          bibend: string;
          bibliography_errors: any[];
          entry_ids: CitationItemId[];
        },
        string[]
      ];
    }

    function getLocaleNames(
      styleXML: string,
      preferredLocale: string
    ): string[];
  }
  export default CSL;
}
