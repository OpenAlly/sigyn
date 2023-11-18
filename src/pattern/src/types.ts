/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */

type Split<S extends string, D extends string> =
    string extends S ? Array<string> :
    S extends "" ? [] :
    S extends `${infer T}${D}${infer U}` ? [`${T}${D}`, ...Split<U, D>] : [S];

type Trim<T> = T extends `${" "}${infer U}` ?
  Trim<U> : T extends `${infer U}${" "}` ? Trim<U> : T;

type ExtractPattern<Pattern extends string> = Pattern extends `${infer _}<${infer Name}>${infer _}` ?
  Name extends "_" ? never : Trim<Name> : never;

type TupleToObject<T extends Array<string>> = {
  [key in ExtractPattern<T[number]>]: string
};
type Simplify<T> = {[KeyType in keyof T]: T[KeyType]} & {};

type Concat<T extends Array<string>> = T extends [
  infer F extends string,
  ...infer R extends Array<string>
] ? `${F} ${Concat<R>}` : "";

type InlineStr<T extends LokiPatternType> =
  T extends Array<string> ? Concat<T> :
  T extends ReadonlyArray<string> ? Concat<[...T]> : T;

export type LokiPatternType = string | Array<string> | ReadonlyArray<string>;
export type LokiLiteralPattern<T extends LokiPatternType> = Simplify<TupleToObject<Split<InlineStr<T>, ">">>>;
