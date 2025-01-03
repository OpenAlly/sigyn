type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

type ConvertEmptyRecord<T, R = string> = T extends Record<string, never> ? R : T;

type Split<S extends string, D extends string> =
  string extends S ? string[] :
    S extends "" ? [] :
      S extends `${infer T}${D}${infer U}` ? [`${T}${D}`, ...Split<U, D>] : [S];

type Trim<S extends string> =
  S extends ` ${infer U}` ? Trim<U> :
    S extends `${infer U} ` ? Trim<U> :
      S;

type Concat<T extends string[]> = T extends [infer F extends string, ...infer R extends string[]]
  ? `${F} ${Concat<R>}`
  : "";

type ArrayToString<T extends LokiPatternType> =
  T extends string[] ? Concat<T> :
    T extends readonly string[] ? Concat<[...T]> :
      T;

type ExtractPattern<Pattern extends string> =
  Pattern extends `${infer _}<${infer Name}>${infer _}` ?
    (Name extends "_" ? never : Trim<Name>)
    :
    never;

type TupleToObject<T extends string[]> = {
  [key in ExtractPattern<T[number]>]: string;
};

export type LokiPatternType = string | string[] | readonly string[];

export type LokiLiteralPattern<T extends LokiPatternType> = ConvertEmptyRecord<Simplify<
  TupleToObject<Split<ArrayToString<T>, ">">>
>>;
