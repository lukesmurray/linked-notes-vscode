import { ContextFileReference } from "../common/types";
import mdastUtilToString from "mdast-util-to-string";

export function contextFileReferenceContextString(
  ref: ContextFileReference
): string {
  if (ref.node.data.context === undefined) {
    // fallback to just display the node if no context exists
    return mdastUtilToString(ref.node);
  }
  return mdastUtilToString(ref.node.data.context);
}
