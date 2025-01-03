// Import Internal Dependencies
import type {
  LokiLiteralPattern,
  LokiPatternType
} from "./types.js";

export interface PatternShape<T extends LokiPatternType = string> {
  compile(): (log: string) => [] | [log: LokiLiteralPattern<T>];
  executeOnLogs(logs: Array<string>): LokiLiteralPattern<T>[];
}

export class NoopPattern<T extends LokiPatternType = string> implements PatternShape<T> {
  compile(): (log: string) => [] | [log: LokiLiteralPattern<T>] {
    return (log) => [log as LokiLiteralPattern<T>];
  }

  executeOnLogs(logs: Array<string>): LokiLiteralPattern<T>[] {
    return logs as LokiLiteralPattern<T>[];
  }
}

export class Pattern<T extends LokiPatternType> implements PatternShape<T> {
  static RegExp() {
    return /<([a-zA-Z0-9 ]+)>/g;
  }

  static escape(value: string): string {
    return value.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
  }

  private pattern: string;

  constructor(pattern: T) {
    this.pattern = Pattern.escape(
      // @ts-ignore
      Array.isArray(pattern) ? pattern.join("") : pattern
    );
  }

  compile(): (log: string) => [] | [log: LokiLiteralPattern<T>] {
    const exprStr = this.pattern.replaceAll(
      Pattern.RegExp(),
      this.replacer.bind(this)
    );

    return (log) => {
      const match = new RegExp(exprStr).exec(log);

      return match === null ? [] : [match.groups as unknown as LokiLiteralPattern<T>];
    };
  }

  executeOnLogs(logs: string[]): LokiLiteralPattern<T>[] {
    return logs.flatMap(this.compile());
  }

  private replacer(_: string, matchingField: string) {
    return `(?<${matchingField.trim()}>.*)`;
  }
}

export type {
  LokiLiteralPattern,
  LokiPatternType
};
