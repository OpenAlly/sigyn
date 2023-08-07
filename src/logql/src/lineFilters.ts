// CONSTANTS
const kLineFilterOperators = {
  lineContains: {
    operator: "|=",
    delimiters: ["`", "'"]
  },
  lineDoesNotContain: {
    operator: "!=",
    delimiters: ["`", "'"]
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
    if (init instanceof LineFilters) {
      return init;
    }

    super();

    if (!init) {
      return this;
    }

    if (typeof init === "string") {
      this.#parse(init);

      return this;
    }
  }

  #parse(query: string) {
    for (const [key, { operator, delimiters }] of Object.entries(kLineFilterOperators)) {
      if (!query.includes(operator)) {
        continue;
      }

      const regex = new RegExp(`\\${operator}\\s*?[${delimiters.join("")}](.*?)[${delimiters.join("")}]`, "g");
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

      return this;
    }

    super.set(operator, [value]);

    return this;
  }

  toString() {
    const lineContains = this.lineContains()
      .map((value, index) => `${index === 0 ? kLineFilterOperators.lineContains.operator : ""} \`${value}\``)
      .join(` ${kLineFilterOperators.lineContains.operator} `);

    const lineDoesNotContain = this.lineDoesNotContain()
      .map((value, index) => `${index === 0 ? kLineFilterOperators.lineDoesNotContain.operator : ""} \`${value}\``)
      .join(` ${kLineFilterOperators.lineDoesNotContain.operator} `);

    const lineContainsRegexMatch = this.lineContainsRegexMatch()
      .map((value, index) => `${index === 0 ? kLineFilterOperators.lineContainsRegexMatch.operator : ""} \`${value}\``)
      .join(` ${kLineFilterOperators.lineContainsRegexMatch.operator} `);

    const lineDoesNotContainRegexMatch = this.lineDoesNotContainRegexMatch()
      .map((value, index) => `${index === 0 ? kLineFilterOperators.lineDoesNotContainRegexMatch.operator : ""} \`${value}\``)
      .join(` ${kLineFilterOperators.lineDoesNotContainRegexMatch.operator} `);

    return `${lineContains} ${lineDoesNotContain} ${lineContainsRegexMatch} ${lineDoesNotContainRegexMatch}`;
  }
}
