// CONSTANTS
const kLabelMatchingOperators = ["=", "!=", "=~", "!~"];
const kEqual = Symbol("equal");
const kNotEqual = Symbol("notEqual");

export type LabelMatchingOperator = "=" | "!=" | "=~" | "!~";

export interface StreamSelectorValue {
  value: string;
  operator: LabelMatchingOperator;
}

export type LabelValue = Partial<StreamSelectorValue> & Pick<StreamSelectorValue, "value">;
export type StreamSelectorOp = { [kEqual]?: string | RegExp; } | { [kNotEqual]?: string | RegExp; };

export class StreamSelector extends Map<string, StreamSelectorValue> {
  static Equal(value: string | RegExp) {
    return {
      [kEqual]: value
    };
  }

  static Not(value: string | RegExp) {
    return {
      [kNotEqual]: value
    };
  }

  constructor(
    init?: string | string[] | Record<string, string | RegExp | StreamSelectorOp> | Iterable<[string, string]> | StreamSelector
  ) {
    super();

    if (!init) {
      return;
    }
    else if (init instanceof StreamSelector) {
      this.#clone(init);
    }
    else if (typeof init === "string") {
      this.#parse(init);
    }
    else if (Symbol.iterator in init) {
      this.#parseIterable(init);
    }
    else {
      this.#parseObject(init);
    }
  }

  #parseIterable(init: string[] | Iterable<[string, string]>) {
    for (const query of init) {
      if (typeof query === "string") {
        this.#parse(query);

        continue;
      }

      const [key, value] = query;
      super.set(key, { value, operator: "=" });
    }
  }

  #parseObject(init: Record<string, string | RegExp | StreamSelectorOp>) {
    for (const [key, value] of Object.entries(init)) {
      if (typeof value === "string") {
        super.set(key, { value, operator: "=" });

        continue;
      }
      else if (value instanceof RegExp) {
        super.set(key, { value: value.source, operator: "=~" });

        continue;
      }

      if (value[kEqual]) {
        super.set(key, {
          value: value[kEqual] instanceof RegExp ? value[kEqual].source : value[kEqual],
          operator: value[kEqual] instanceof RegExp ? "=~" : "="
        });

        continue;
      }

      if (value[kNotEqual]) {
        super.set(key, {
          value: value[kNotEqual] instanceof RegExp ? value[kNotEqual].source : value[kNotEqual],
          operator: value[kNotEqual] instanceof RegExp ? "!~" : "!="
        });

        continue;
      }
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
  override set(
    labelKey: string,
    labelValue: LabelValue | string,
    op?: LabelMatchingOperator
  ) {
    if (typeof labelValue === "string") {
      super.set(labelKey, { value: labelValue, operator: op ?? "=" });
    }
    else {
      const { value, operator = op ?? "=" } = labelValue;

      super.set(labelKey, { value, operator });
    }

    return this;
  }

  override toString() {
    const selectorStr = [...this.entries()]
      .map(([key, { operator, value }]) => `${key}${operator}"${value}"`)
      .join(",");

    return `{${selectorStr}}`;
  }

  kv(): Record<string, string> {
    const streamSelectors = {};

    for (const [key, { value }] of this.entries()) {
      streamSelectors[key] = value;
    }

    return streamSelectors;
  }

  toJSON(): Record<string, StreamSelectorValue> {
    const streamSelectors = {};

    for (const [key, { operator, value }] of this.entries()) {
      streamSelectors[key] = { operator, value };
    }

    return streamSelectors;
  }
}
