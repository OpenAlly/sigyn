// CONSTANTS
const kLabelMatchingOperators = ["=", "!=", "=~", "!~"];

export type LabelMatchingOperator = "=" | "!=" | "=~" | "!~";

export interface StreamSelectorValue {
  value: string;
  operator: LabelMatchingOperator;
}

export type LabelValue = Partial<StreamSelectorValue> & Pick<StreamSelectorValue, "value">;

export class StreamSelector extends Map<string, StreamSelectorValue> {
  constructor(init?: string | string[] | Iterable<[string, string]> | StreamSelector) {
    super();

    if (init instanceof StreamSelector) {
      this.#clone(init);

      return;
    }

    if (!init) {
      return;
    }

    if (typeof init === "string") {
      this.#parse(init);

      return;
    }

    for (const query of init) {
      if (typeof query === "string") {
        this.#parse(query);

        continue;
      }

      const [key, value] = query;
      super.set(key, { value, operator: "=" });
    }
  }

  #clone(streamSelector: StreamSelector) {
    for (const [labelKey, labelValue] of streamSelector) {
      this.set(labelKey, labelValue);
    }
  }

  #parse(query: string) {
    const regex = new RegExp(`([a-zA-Z]*)(${kLabelMatchingOperators.join("|")})["\`](.*?)["\`]`, "g");

    for (const [, key, operator, value] of query.matchAll(regex)) {
      super.set(key, { value, operator: operator as LabelMatchingOperator });
    }
  }

  /**
   * Add a new stream selector with a specified key and value.
   *
   * If `labelValue` is a `LabelValue`, the default operator will be an **exactlyEqual** and can be either be passed
   *  via the `operator` property of `LabelValue` or as a third argument to be modified.
   *
   * If `labelValue` is a `string`, the default operator will be an **exactlyEqual** and must be passed as a third argument to be modified.
   */
  set(labelKey: string, labelValue: LabelValue | string, op?: LabelMatchingOperator) {
    if (typeof labelValue === "string") {
      super.set(labelKey, { value: labelValue, operator: op ?? "=" });

      return this;
    }

    const { value, operator = op ?? "=" } = labelValue;

    super.set(labelKey, { value, operator });

    return this;
  }

  toString() {
    return `{${[...this.entries()].map(([key, { operator, value }]) => `${key}${operator}"${value}"`).join(",")}}`;
  }
}
