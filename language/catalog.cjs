// SPDX-License-Identifier: MIT
// Shared by the extension and the manifest generator; no VS Code dependency.
const fs = require('node:fs');
const path = require('node:path');
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const placeholders = text => [...text.matchAll(/\{\w+\}/g)].map(match => match[0]).sort().join(',');
const withFallback = (language, english) => language && english ? { ...language, manifest: { ...english.manifest, ...language.manifest }, messages: { ...english.messages, ...language.messages } } : language;
function validateSections(language, english) {
  for (const section of ['manifest', 'messages']) for (const [key, source] of Object.entries(english[section])) {
    if (own(language[section], key) && placeholders(source) !== placeholders(language[section][key])) throw Error('Translation placeholders differ: ' + key);
  }
}
function readLanguage(file, english) {
  const name = path.basename(file), match = /^interface_([a-z]{2,3}_[a-z]{2,4}(?:_[a-z0-9]{2,8})?)\.json$/.exec(name);
  if (!match) throw Error('Use interface_<language_region>.json with lowercase codes');
  const data = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  if (!data || typeof data.name !== 'string' || !data.name.trim() || !/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/.test(data.vscodeLocale)) throw Error('name and a valid vscodeLocale are required');
  for (const section of ['manifest', 'messages']) {
    if (data[section] === undefined) data[section] = {};
    if (!data[section] || Array.isArray(data[section]) || typeof data[section] !== 'object') throw Error('Missing object: ' + section);
    for (const [key, value] of Object.entries(data[section])) if (typeof value !== 'string' || !value.trim()) throw Error('Expected nonempty text: ' + section + '.' + key);
  }
  for (const [key, value] of Object.entries(data.messages)) if (placeholders(key) !== placeholders(value)) throw Error('Message placeholders differ: ' + key);
  const language = { ...data, code: match[1], file: name };
  if (english) validateSections(language, english);
  return withFallback(language, english);
}
function loadCatalog(directory, referenceEnglish) {
  const languages = [], errors = [];
  if (!fs.existsSync(directory)) return { languages, errors: ['Language directory is missing: ' + directory] };
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name, 'en'))) {
    if (!entry.isFile() || !/^interface_.*\.json$/i.test(entry.name)) continue;
    try {
      const data = readLanguage(path.join(directory, entry.name));
      if (languages.some(language => language.vscodeLocale === data.vscodeLocale)) throw Error('Duplicate vscodeLocale: ' + data.vscodeLocale);
      languages.push(data);
    } catch (error) { errors.push(entry.name + ': ' + error.message); }
  }
  const english = referenceEnglish || languages.find(language => language.code === 'en_us');
  if (!english) errors.push('interface_en_us.json is required');
  else for (let index = languages.length - 1; index >= 0; index--) {
    const language = languages[index];
    try {
      validateSections(language, english);
    } catch (error) { errors.push(language.file + ': ' + error.message); languages.splice(index, 1); }
  }
  return { languages, errors };
}
function selectLanguage(languages, selection = 'auto', environment = 'en') {
  const normalize = code => code.toLowerCase().replaceAll('-', '_');
  const requested = normalize(selection === 'auto' ? environment : selection);
  const english = languages.find(language => language.code === 'en_us');
  const selected = languages.find(language => language.code === requested || normalize(language.vscodeLocale) === requested)
    || (selection === 'auto' ? languages.find(language => language.code.split('_')[0] === requested.split('_')[0]) : undefined)
    || english;
  return withFallback(selected, english);
}
function translate(language, key, ...args) {
  const text = language && own(language.messages, key) ? language.messages[key] : key;
  return text.replace(/\{(\d+)\}/g, (token, index) => index < args.length ? String(args[index]) : token);
}
module.exports = { loadCatalog, readLanguage, selectLanguage, translate };
