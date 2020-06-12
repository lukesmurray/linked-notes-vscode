import * as UNIST from "unist";

// see for add https://github.com/remarkjs/remark/tree/master/packages/remark-parse#addnode-parent
export interface InlineTokenizerAdd {
  (node: UNIST.Node, parent?: UNIST.Node): UNIST.Node;
  test: () => UNIST.Position;
}

// see for eat https://github.com/remarkjs/remark/tree/master/packages/remark-parse#eatsubvalue
export interface InlineTokenizerEat {
  now: () => UNIST.Point;
  (subValue: string): InlineTokenizerAdd;
}

export type IInlineTokenizerReturn = UNIST.Node | boolean | undefined;

export interface IInlineTokenizer {
  // see https://github.com/remarkjs/remark/tree/master/packages/remark-parse#function-tokenizereat-value-silent
  (
    eat: InlineTokenizerEat,
    value: string,
    silent: boolean
  ): IInlineTokenizerReturn;
  // see locator https://github.com/remarkjs/remark/tree/master/packages/remark-parse#tokenizerlocatorvalue-fromindex
  locator: (value: string, fromIndex: number) => number;
  onlyAtStart?: boolean;
  notInBlock?: boolean;
  notInList?: boolean;
  notInLink?: boolean;
}
