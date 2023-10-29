/* eslint-disable func-style */

// Import Internal Dependencies
import { capitalize, dnsresolve } from "./functions";

// CONSTANTS
const kFunctions = {
  capitalize,
  dnsresolve
};

export interface MorphixOptions {
  transform?: (data: { value: unknown; key: string }) => unknown;
  ignoreMissing?: boolean;
}

export class MissingValueError extends Error {
  key: string;

  constructor(key: string) {
    super(`Missing a value for ${key ? `the placeholder: ${key}` : "a placeholder"}`);
    this.name = "MissingValueError";
    this.key = key;
  }
}

export async function morphix(
  template: string,
  data: Record<string, any> | unknown[],
  options: MorphixOptions = {}
) {
  const {
    transform = ({ value }) => value,
    ignoreMissing = false
  } = options;

  if (typeof template !== "string") {
    throw new TypeError(`Expected a \`string\` in the first argument, got \`${typeof template}\``);
  }

  if (typeof data !== "object") {
    throw new TypeError(`Expected an \`object\` or \`Array\` in the second argument, got \`${typeof data}\``);
  }

  const replace = async(placeholder: string, key: string, func: string | undefined) => {
    let value: string | undefined = undefined;
    for (const property of key?.split(".")) {
      // eslint-disable-next-line no-nested-ternary
      value = value ? value[property] : data ? data[property] : undefined;
    }

    const transformedValue = transform({ value, key });
    if (transformedValue === undefined) {
      if (ignoreMissing) {
        return placeholder;
      }

      throw new MissingValueError(key);
    }

    if (func === undefined) {
      return String(transformedValue);
    }

    return await kFunctions[func](String(transformedValue));
  };

  const braceFnRegex = /{\s{0,1}([a-z0-9-.]*)\s{0,1}(?:\|\s{0,1}((?:(?!{)[a-z0-9-]*)*?)\s{0,1})?}/gi;
  let formattedTemplate = template;

  for (const [match, placeholder, func] of template.matchAll(braceFnRegex)) {
    const replaceText = await replace(match, placeholder, func);
    formattedTemplate = formattedTemplate.replace(match, () => replaceText);
  }

  return formattedTemplate;
}
