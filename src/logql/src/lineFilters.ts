// CONSTANTS
const kLineFilterOperators = {
  lineContains: {
    operator: "|=",
    delimiters: ["`", "'", "\""]
  },
  lineDoesNotContain: {
    operator: "!=",
    delimiters: ["`", "'", "\""]
  },
  lineContainsRegexMatch: {
    operator: "|~",
    delimiters: ["`"]
  },
  lineDoesNotContainRegexMatch: {
    operator: "!~",
    delimiters: ["`"]
  }
};

export type LineFilterOperator = keyof typeof kLineFilterOperators;

export class LineFilters extends Map<LineFilterOperator, string[]> {
  constructor(init?: string | LineFilters) {
    super();

    if (init instanceof LineFilters) {
      this.#clone(init);
    }
    else if (init) {
      this.#parse(init);
    }
  }

  #clone(lineFilters: LineFilters) {
    for (const [operator, values] of lineFilters) {
      this.set(operator, values);
    }
  }

  #parse(query: string) {
    for (const [key, { operator, delimiters }] of Object.entries(kLineFilterOperators)) {
      if (!query.includes(operator)) {
        continue;
      }

      const operatorDelimiter = delimiters.join("");
      const regex = new RegExp(`\\${operator}\\s*?[${operatorDelimiter}](.*?)[${operatorDelimiter}]`, "g");
      const values = [...query.matchAll(regex)].flatMap((value) => value[1]);

      if (values.length > 0) {
        if (super.has(key as LineFilterOperator)) {
          const previousValues = super.get(key as LineFilterOperator)!;
          values.push(...previousValues);
          super.set(key as LineFilterOperator, values);

          continue;
        }

        super.set(key as LineFilterOperator, values);
      }
    }

    if (this.size === 0 && query.length > 0) {
      this.set("lineContains", [query]);
    }
  }

  lineContains() {
    return this.get("lineContains") ?? [];
  }

  lineDoesNotContain() {
    return this.get("lineDoesNotContain") ?? [];
  }

  lineContainsRegexMatch() {
    return this.get("lineContainsRegexMatch") ?? [];
  }

  lineDoesNotContainRegexMatch() {
    return this.get("lineDoesNotContainRegexMatch") ?? [];
  }

  add(value: string, operator: LineFilterOperator = "lineContains") {
    if (super.has(operator)) {
      const previousValues = super.get(operator)!;
      super.set(operator, [...previousValues, value]);
    }
    else {
      super.set(operator, [value]);
    }

    return this;
  }

  override toString() {
    function serializeExpression(values: string[], operator: string) {
      return values.map((value) => `${operator} \`${value}\``).join(` ${operator} `);
    }

    const lineContains = serializeExpression(this.lineContains(), kLineFilterOperators.lineContains.operator);
    const lineDoesNotContain = serializeExpression(this.lineDoesNotContain(), kLineFilterOperators.lineDoesNotContain.operator);
    const lineContainsRegexMatch = serializeExpression(
      this.lineContainsRegexMatch(),
      kLineFilterOperators.lineContainsRegexMatch.operator
    );
    const lineDoesNotContainRegexMatch = serializeExpression(
      this.lineDoesNotContainRegexMatch(),
      kLineFilterOperators.lineDoesNotContainRegexMatch.operator
    );

    return `${lineContains} ${lineDoesNotContain} ${lineContainsRegexMatch} ${lineDoesNotContainRegexMatch}`;
  }
}
