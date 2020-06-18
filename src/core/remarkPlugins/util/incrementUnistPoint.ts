import * as UNIST from "unist";

export const incrementUnistPoint = (
  point: UNIST.Point,
  by: number
): UNIST.Point => {
  point = { ...point };
  point.column += by;
  point.offset = point.offset === undefined ? undefined : point.offset + by;
  return point;
};
