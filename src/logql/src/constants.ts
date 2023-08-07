export interface QueryOperator {
  operator: string;
  delimiters: string[];
}

export const QUERY_OPERATORS = {
  lineContains: {
    operator: "|=",
    delimiters: ["`", "'"]
  },
  lineDoesNotContain: {
    operator: "!=",
    delimiters: ["`", "'"]
  }
};
