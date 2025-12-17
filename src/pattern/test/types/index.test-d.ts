// Import Third-party Dependencies
import {
  expectType,
  expectAssignable
} from "tsd";

// Import Internal Dependencies
import {
  Pattern,
  type PatternShape,
  NoopPattern
} from "../../src/pattern.ts";

expectType<Pattern<string>>(new Pattern("foobar"));

expectType<{
  verb: string;
  code: string;
}[]>(new Pattern("<verb> <_> <code>").executeOnLogs([]));
expectType<{
  verb: string;
  code: string;
}[]>(new Pattern(["<verb>", " <_> ", "<code>"] as const).executeOnLogs([]));

expectType<(log: string) => [] | [log: string]>(new NoopPattern().compile());
expectType<(log: string) => [] | [log: string]>(new Pattern("invalid pattern should return string").compile());
expectType<(log: string) => [] | [log: { foobar: string; }]>(new Pattern("<_> <foobar>").compile());

expectType<string[]>(new Pattern("invalid pattern should return string").executeOnLogs([]));
expectType<string[]>(new NoopPattern().executeOnLogs([]));

// eslint-disable-next-line no-constant-binary-expression
expectAssignable<PatternShape<string>>(new NoopPattern() || new Pattern("<foobar>"));
expectAssignable<PatternShape<string>>(new NoopPattern());
expectAssignable<PatternShape<string>>(new Pattern("foobar"));
expectAssignable<PatternShape<string>>(new Pattern(["foobar", "yo"]));
expectAssignable<PatternShape<"<_> <foobar>">>(new Pattern("<_> <foobar>"));

