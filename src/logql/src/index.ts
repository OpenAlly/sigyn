// Import Internal Dependencies
import { StreamSelector } from "./streamSelector";
import { LineFilters } from "./lineFilters";
import { LabelFilters } from "./labelFilters";
import { ParserExpression } from "./parserExpression";

export class LogQL {
  streamSelector = new StreamSelector();
  lineFilters = new LineFilters();
  labelFilters = new LabelFilters();
  parserExpression = new ParserExpression();

  constructor(init?: string | string[] | StreamSelector | LineFilters | LabelFilters | ParserExpression) {
    if (typeof init === "string") {
      this.streamSelector = new StreamSelector(init);
      this.lineFilters = new LineFilters(init);
      this.labelFilters = new LabelFilters(init);
      this.parserExpression = new ParserExpression(init);

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

  toString() {
    return `
      ${this.streamSelector.toString()}
      ${this.lineFilters.toString()}
      ${this.labelFilters.toString()}
      ${this.parserExpression.toString()}
    `.trim().replace(/\s\s+/g, " ");
  }
}
