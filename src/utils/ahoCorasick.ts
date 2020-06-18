import AhoCorasickAlgo from "ahocorasick";
import fromPairs from "lodash/fromPairs";
import groupBy from "lodash/groupBy";
import mapValues from "lodash/mapValues";
import maxBy from "lodash/maxBy";
import type { Dictionary } from "lodash";

/**
 * represents a match in the aho algorithm
 */
export interface AhoMatch<T> {
  /**
   * the pattern which was matched
   */
  pattern: string;
  /**
   * the value associated with the pattern
   */
  value: T;
  /**
   * the index of the first letter of the match in the text
   */
  start: number;
  /**
   * the index just after the last letter of the match in the text
   */
  end: number;
}

class AhoCorasick<T> {
  private readonly algo: AhoCorasickAlgo;
  private readonly keywordMap: Dictionary<T>;
  constructor(patterns: Array<[string, T]>) {
    // create the aho corasick value
    this.algo = new AhoCorasickAlgo(patterns.map((v) => v[0]));
    // map of patterns to T values
    this.keywordMap = fromPairs(patterns);
    this.matches = this.matches.bind(this);
  }

  public matches(text: string): Array<AhoMatch<T>> {
    return this.algo.search(text).flatMap(([end, patterns]) =>
      // reshape each matched pattern from end open interval
      // to end closed interval and include the matched
      // value and
      patterns.map((pattern) => ({
        pattern,
        value: this.keywordMap[pattern],
        end: end + 1,
        start: end + 1 - pattern.length,
      }))
    );
  }

  /**
   * Return the matches in leftmost longest order. If two matches start in the
   * same position the longer one is included. No overlapping matches are
   * included. So a leftmost longest match will overwrite any matches
   * to its right.
   * @param text the text to match against
   */
  public leftMostLongestMatches(text: string): Array<AhoMatch<T>> {
    const matches = this.matches(text);
    // group matches by their start
    const matchesByStart = groupBy(matches, (v) => v.start);
    // for each start match group retain the longest
    const maxByStart = mapValues(matchesByStart, (v) => maxBy(v, (w) => w.end));

    // iterate over possible starts, updating an end pointer, and only
    // taking matches which do not overlap with a match to the left
    let end = 0;
    const validMatches: Array<AhoMatch<T>> = [];
    for (const start of (Object.keys(maxByStart) as unknown) as number[]) {
      if (start < end) {
        continue;
      }
      const nextMatch = maxByStart[start];
      if (nextMatch === undefined) {
        continue;
      }
      end = nextMatch.end - 1;
      validMatches.push(nextMatch);
    }
    return validMatches;
  }
}

export default AhoCorasick;
