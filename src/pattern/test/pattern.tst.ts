// Import Third-party Dependencies
import { expect, test } from "tstyche";

// Import Internal Dependencies
import {
  Pattern,
  type PatternShape,
  NoopPattern
} from "../src/pattern.ts";

test("Pattern<string> type", () => {
  expect(new Pattern("foobar")).type.toBe<Pattern<"foobar">>();
});

test("Pattern executeOnLogs with string pattern", () => {
  expect(new Pattern("<verb> <_> <code>").executeOnLogs([])).type.toBe<{
    verb: string;
    code: string;
  }[]>();
});

test("Pattern executeOnLogs with const array pattern", () => {
  expect(new Pattern(["<verb>", " <_> ", "<code>"] as const).executeOnLogs([])).type.toBe<{
    verb: string;
    code: string;
  }[]>();
});

test("NoopPattern compile", () => {
  expect(new NoopPattern().compile()).type.toBe<(log: string) => [] | [log: string]>();
});

test("Pattern with invalid pattern compile", () => {
  expect(new Pattern("invalid pattern should return string").compile()).type.toBe<(log: string) => [] | [log: string]>();
});

test("Pattern with valid pattern compile", () => {
  expect(new Pattern("<_> <foobar>").compile()).type.toBe<(log: string) => [] | [log: { foobar: string; }]>();
});

test("Pattern with invalid pattern executeOnLogs", () => {
  expect(new Pattern("invalid pattern should return string").executeOnLogs([])).type.toBe<string[]>();
});

test("NoopPattern executeOnLogs", () => {
  expect(new NoopPattern().executeOnLogs([])).type.toBe<string[]>();
});

test("NoopPattern or Pattern assignable to PatternShape", () => {
  // eslint-disable-next-line no-constant-binary-expression
  expect(new NoopPattern() || new Pattern("<foobar>")).type.toBeAssignableTo<PatternShape<string>>();
});

test("NoopPattern assignable to PatternShape", () => {
  expect(new NoopPattern()).type.toBeAssignableTo<PatternShape<string>>();
});

test("Pattern assignable to PatternShape", () => {
  expect(new Pattern("foobar")).type.toBeAssignableTo<PatternShape<string>>();
});

test("Pattern with array assignable to PatternShape", () => {
  expect(new Pattern(["foobar", "yo"])).type.toBeAssignableTo<PatternShape<string>>();
});

test("Pattern with specific pattern assignable to PatternShape", () => {
  expect(new Pattern("<_> <foobar>")).type.toBeAssignableTo<PatternShape<"<_> <foobar>">>();
});

