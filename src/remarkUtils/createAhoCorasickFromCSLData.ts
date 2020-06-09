import AhoCorasick from "../utils/ahoCorasick";
import { CslData } from "../types/csl-data";

export function createAhoCorasickFromCSLJSON(items: CslData) {
  // key aho corasick by the citation keys
  return new AhoCorasick(items.map((v) => ["@" + v.id, v]));
}
