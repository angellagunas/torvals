
const jsons = require.context('json-loader!./', false,  /\.json$/)
let json = {}
jsons.keys().forEach((key) => {
  const obj = jsons(key)
  json = Object.assign(obj, json)
})
export const translations = json

export function flattenMessages(nestedMessages, prefix = '') {
  return Object.keys(nestedMessages).reduce((messages, key) => {
    const value = nestedMessages[key];
    const prefixedKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      messages[prefixedKey] = value;
    } else {
      Object.assign(messages, flattenMessages(value, prefixedKey));
    }

    return messages;
  }, {});
}
