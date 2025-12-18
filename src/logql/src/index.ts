// Import Internal Dependencies
import { StreamSelector } from "./streamSelector.ts";
import { LineFilters } from "./lineFilters.ts";
import { LabelFilters } from "./labelFilters.ts";
import { ParserExpression } from "./parserExpression.ts";

export { StreamSelector, LineFilters, LabelFilters, ParserExpression };

export class LogQL {
  static type(QL: string | LogQL) {
    if (typeof QL === "string") {
      return /^[a-zA-Z_\s]+\(/g.test(QL) ? "metric" : "query";
    }

    return QL.type;
  }

  #type: "metric" | "query" = "query";
  #rawInit: string;

  streamSelector = new StreamSelector();
  lineFilters = new LineFilters();
  labelFilters = new LabelFilters();
  parserExpression = new ParserExpression();

  constructor(
    init?: string | string[] | StreamSelector | LineFilters | LabelFilters | ParserExpression
  ) {
    if (typeof init === "string") {
      this.#type = LogQL.type(init);

      if (this.#type === "metric") {
        this.#rawInit = init;
      }
      const finalInit = this.#type === "query" ? init : void 0;
      this.streamSelector = new StreamSelector(finalInit);
      this.lineFilters = new LineFilters(finalInit);
      this.labelFilters = new LabelFilters(finalInit);
      this.parserExpression = new ParserExpression(finalInit);

      return this;
    }

    if (Array.isArray(init)) {
      for (const query of init) {
        this.lineFilters.add(query);
      }

      return this;
    }

    if (init instanceof StreamSelector) {
      this.streamSelector = new StreamSelector(init);
    }

    if (init instanceof LineFilters) {
      this.lineFilters = new LineFilters(init);
    }

    if (init instanceof LabelFilters) {
      this.labelFilters = new LabelFilters(init);
    }

    if (init instanceof ParserExpression) {
      this.parserExpression = new ParserExpression(init);
    }
  }

  get type() {
    return this.#type;
  }

  lineEq(value: string) {
    this.lineFilters.add(value, "lineContains");

    return this;
  }

  lineNotEq(value: string) {
    this.lineFilters.add(value, "lineDoesNotContain");

    return this;
  }

  lineRegEq(value: string) {
    this.lineFilters.add(value, "lineContainsRegexMatch");

    return this;
  }

  lineRegNotEq(value: string) {
    this.lineFilters.add(value, "lineDoesNotContainRegexMatch");

    return this;
  }

  toString() {
    if (this.#type === "metric") {
      return this.#rawInit;
    }

    return `
      ${this.streamSelector.toString()}
      ${this.lineFilters.toString()}
      ${this.parserExpression.lowStringEnd()}
      ${this.labelFilters.toString()}
      ${this.parserExpression.highStringEnd()}
    `.trim().replace(/\s\s+/g, " ");
  }
}
