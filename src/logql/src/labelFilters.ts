// CONSTANTS
const kLabelFilterOperators = ["=", "==", "!=", "=~", "!~", ">", ">=", "<", "<="];
const kDurationUnits = ["ns", "us", "µs", "ms", "s", "m", "h"];
const kBytesUnit = ["b", "kib", "kb", "mib", "mb", "gib", "gb", "tib", "tb", "pib", "pb", "eib", "eb"];

export type LabelFilterOperator = "=" | "==" | "!=" | "=~" | "!~" | ">" | ">=" | "<" | "<=";

export interface LabelFilter {
  value: number | string;
  operator: LabelFilterOperator;
}

export type LabelValue = Partial<LabelFilter> & Pick<LabelFilter, "value">;

export class LabelFilters extends Map<string, LabelFilter[]> {
  static removeStreamSelector(query: string) {
    const closeBracketIndex = query.indexOf("}");

    return closeBracketIndex > -1 ? query.slice(closeBracketIndex + 1) : query;
  }

  constructor(init?: string | LabelFilters) {
    super();

    if (init instanceof LabelFilters) {
      this.#clone(init);
    }
    else if (init) {
      this.#parse(LabelFilters.removeStreamSelector(init));
    }
  }

  #clone(labelFilters: LabelFilters) {
    for (const [labelKey, labelValues] of labelFilters) {
      for (const labelValue of labelValues) {
        this.#set(labelKey, labelValue);
      }
    }
  }

  #parse(query: string) {
    const labelsFilterOperators = kLabelFilterOperators.join("|");
    const durationUnits = kDurationUnits.join("|");
    const bytesUnits = kBytesUnit.join("|");

    const regex = new RegExp(
      `([a-zA-Z]+)\\s*(${labelsFilterOperators})\\s*(["\`].*?["\`]|\\d+(?:\\.\\d+)?(?:${durationUnits}|${bytesUnits})?)`,
      "g"
    );

    for (const [, key, operator, value] of query.matchAll(regex)) {
      this.#set(key, {
        value: Number.isNaN(Number(value)) ? value.replaceAll(/["`]/g, "") : Number(value),
        operator: operator as LabelFilterOperator
      });
    }
  }

  #set(labelKey: string, labelValue: LabelFilter) {
    if (this.has(labelKey)) {
      const labelFilters = this.get(labelKey)!;
      labelFilters.push(labelValue);

      super.set(labelKey, labelFilters);

      return;
    }

    super.set(labelKey, [labelValue]);
  }

  /**
   * Add a new label filter with a specified key and value.
   *
   * If `labelValue` is a `LabelValue` (or an array of `LabelValue`), the default operator will be an `=` and can be
   * either be passed via the `operator` property of `LabelValue` or as a third argument to be modified.
   *
   * If `labelValue` is a `string` or a `number`, the default operator will be an **exactlyEqual** and must be passed as
   * a third argument to be modified.
   * */
  override set(labelKey: string, labelValue: LabelValue[] | LabelValue | string | number, op: LabelFilterOperator = "=") {
    if (typeof labelValue === "string" || typeof labelValue === "number") {
      this.#set(labelKey, { value: labelValue, operator: op });

      return this;
    }

    if (Array.isArray(labelValue)) {
      for (const label of labelValue) {
        const { value, operator = op } = label;

        this.#set(labelKey, { value, operator });
      }

      return this;
    }

    const { value, operator = op } = labelValue;

    this.#set(labelKey, { value, operator });

    return this;
  }

  override toString() {
    return `${[...this.entries()].flatMap(([key, values], index) => values.map(({ operator, value }) => {
      const delimiter = this.#getDelimiter(value, operator);

      return `${index === 0 ? "| " : ""}${key} ${operator} ${delimiter}${value}${delimiter}`;
    })).join(" | ")}`;
  }

  toJSON(): Record<string, LabelFilter[]> {
    const labelFilters: Record<string, LabelFilter[]> = {};

    for (const [key, values] of this.entries()) {
      labelFilters[key] = values;
    }

    return labelFilters;
  }

  kv(): Record<string, string[]> {
    const labelFilters: Record<string, string[]> = {};

    for (const [key, values] of this.entries()) {
      labelFilters[key] = values.map(({ value }) => String(value));
    }

    return labelFilters;
  }

  #getDelimiter(value: string | number, operator: LabelFilterOperator) {
    if (typeof value === "number") {
      return "";
    }

    if (operator === "=~" || operator === "!~") {
      return "`";
    }

    return "\"";
  }
}
