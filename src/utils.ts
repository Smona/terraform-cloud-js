import { AxiosError } from "axios";
import decamelize from "decamelize";
import camelCase from "camelcase";

export function displayError(e: AxiosError) {
  console.error(e.response && e.response.data);
  return null;
}

export function done(checker: () => Promise<boolean>, interval = 1000) {
  return new Promise(res => {
    let invalidated = false;
    const intervalID = setInterval(async () => {
      const ready = await checker();
      if (ready && !invalidated) {
        invalidated = true;
        clearInterval(intervalID);
        res();
      }
    }, interval);
  });
}

type WideOpen = { [k: string]: any };

const recursiveKeyTransform = (transformer: (inputKey: string) => string) =>
  function(attributes: WideOpen) {
    const payload: WideOpen = {};

    const convertObject = (base: WideOpen, target: WideOpen) =>
      Object.keys(base)
        .map(k => ({ old: k, new: transformer(k) }))
        .forEach(pair => {
          const value = base[pair.old];
          target[pair.new] = value;

          if (typeof value === "object") {
            target[pair.new] = {};
            convertObject(value, target[pair.new]);
          }
        });
    convertObject(attributes, payload);
    return payload;
  };

export const kebabize = recursiveKeyTransform(k => decamelize(k, "-"));
export const camelize = recursiveKeyTransform(k => camelCase(k));
