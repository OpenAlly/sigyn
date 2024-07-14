/* eslint-disable func-style */

// Import Internal Dependencies
import { capitalize, dnsresolve } from "./functions";

// CONSTANTS
const kDefaultFunctions: Record<string, MorphixFunction> = {
  capitalize,
  dnsresolve
};

export type MorphixFunction = (value: string) => Promise<string> | string;

export interface MorphixOptions {
  /**
   * Performs arbitrary operations for each interpolation.
   * If the returned value is undefined, the behavior depends on the ignoreMissing option.
   * Otherwise, the returned value is converted to a string and embedded into the template.
   */
  transform?: (data: { value: unknown; key: string }) => unknown;
  /**
   * By default, Morphix throws a MissingValueError when a placeholder resolves to undefined.
   * If this option is set to true, it simply ignores the unresolved placeholder and leaves it as is.
   *
   * @default false
   */
  ignoreMissing?: boolean;
  customFunctions?: Record<string, MorphixFunction>;
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
    ignoreMissing = false,
    customFunctions = {}
  } = options;
  const functions = { ...customFunctions, ...kDefaultFunctions };

  if (typeof template !== "string") {
    throw new TypeError(`Expected a \`string\` in the first argument, got \`${typeof template}\``);
  }

  if (typeof data !== "object") {
    throw new TypeError(`Expected an \`object\` or \`Array\` in the second argument, got \`${typeof data}\``);
  }

  const replace = async(placeholder: string, key: string, func: string | undefined) => {
    let value: string | undefined = undefined;
    const keys = key?.split(".") ?? [];
    for (const property of keys) {
      if (data[property] !== void 0) {
        value = data[property];
        continue;
      }
      else if (value && value[property]) {
        value = value[property];
        continue;
      }
      break;
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

    return await functions[func](String(transformedValue));
  };

  const braceFnRegex = /{\s{0,1}([a-z0-9-.]*)\s{0,1}(?:\|\s{0,1}((?:(?!{)[a-z0-9-]*)*?)\s{0,1})?}/gi;
  let formattedTemplate = template;

  for (const [match, placeholder, func] of template.matchAll(braceFnRegex)) {
    const replaceText = await replace(match, placeholder, func);
    formattedTemplate = formattedTemplate.replace(match, () => replaceText);
  }

  return formattedTemplate;
}
