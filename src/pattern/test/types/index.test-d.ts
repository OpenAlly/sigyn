// Import Third-party Dependencies
import { expectType, expectAssignable } from "tsd";

// Import Internal Dependencies
import { Pattern, NoopPattern, PatternShape } from "../../src/pattern";

expectType<Pattern<string>>(new Pattern("foobar"));

expectType<{
  verb: string;
  code: string;
}[]>(new Pattern("<verb> <_> <code>").executeOnLogs([]));
expectType<string[]>(new Pattern("invalid pattern should return string").executeOnLogs([]));
expectType<{
  verb: string;
  code: string;
}[]>(new Pattern(["<verb>", " <_> ", "<code>"] as const).executeOnLogs([]));

expectAssignable<PatternShape>(new NoopPattern());
expectAssignable<PatternShape>(new Pattern("foobar"));
