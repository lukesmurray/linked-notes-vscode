import * as UNIST from "unist";

export const incrementUnistPoint = (point: UNIST.Point, by: number) => {
  point = { ...point };
  point.column += by;
  point.offset = point.offset === undefined ? undefined : point.offset + by;
  return point;
};
