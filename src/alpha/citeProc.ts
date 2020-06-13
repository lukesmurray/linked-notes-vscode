import CSL from "citeproc";
import keyBy from "lodash/keyBy";
import memoizeOne from "memoize-one";
import { CslData } from "../types/csl-data";
import { CiteProcCitation } from "../core/remarkPlugins/remarkCiteproc";

/**
 * from https://github.com/citation-style-language/styles
 * Given a file chicago-fullnote-bibliography-16th-edition.csl the style is the
 * `chicago-fullnote-bibliography-16th-edition` portion.
 */
const defaultStyle = "chicago-fullnote-bibliography-16th-edition";
/**
 * from https://github.com/citation-style-language/locales
 * Given a file `locales-en-US.xml` the lang is the `en-US` portion.
 */
const defaultLocale = "en-US";

export const getCitations = async (
  citations: CiteProcCitation[],
  items: CslData,
  style: string = defaultStyle,
  preferredLocale: string = defaultLocale
) => {
  // normalize items
  const itemsById = keyBy(items, (item) => item.id);

  // get the style
  const styleString = await getStyleString(style);

  // normalize locales
  const localeStringByLocale = await getLocaleStringsByLocale(
    styleString,
    preferredLocale
  );

  // create the engine
  let citeproc = new CSL.Engine(
    {
      retrieveItem: (id) => itemsById[id],
      retrieveLocale: (locale) => {
        return localeStringByLocale[locale];
      },
    },
    styleString
  );
  let citationsPre: any[] = [];
  let citationsPost: any[] = [];
  for (let i = 0; i < citations.length; i++) {
    citeproc.processCitationCluster(
      {
        citationItems: citations[i].data.citation.citationItems!.map(
          (v) => v.itemData!
        ),
        properties: {
          nodeIndex: citations[i].data.citation.properties?.noteIndex,
        },
      },
      citationsPre,
      citationsPost
    );
  }

  // add the items to the engine
  citeproc.updateItems(items.map((i) => i.id));
  // create a bibliography
  const bibliography = citeproc.makeBibliography();
  console.log("making bibliography");
  console.log(bibliography);
};

const getLocaleStringsByLocale = memoizeOne(
  async (styleText: string, preferredLocale: string) => {
    const locales = CSL.getLocaleNames(styleText, preferredLocale);
    const localeTexts = await Promise.all(
      locales.map((locale) =>
        fetch(
          `https://raw.githubusercontent.com/citation-style-language/locales/master/locales-${locale}.xml`
        ).then((res) => res.text())
      )
    );
    const localeTextsByLocale = locales.reduce(
      (prev, curr, idx) => {
        return { ...prev, [curr]: localeTexts[idx] };
      },
      {} as {
        [locale: string]: string;
      }
    );
    return localeTextsByLocale;
  }
);

const getStyleString = memoizeOne(async (style: string) => {
  const text = await fetch(
    `https://raw.githubusercontent.com/citation-style-language/styles/master/${style}.csl`
  ).then((res) => res.text());
  return text;
});
