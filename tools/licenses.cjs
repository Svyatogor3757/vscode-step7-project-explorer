// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Cody (https://github.com/Svyatogor3757)
// Offline inventory and release preflight. --write records facts, not legal approval.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file));
const json = file => JSON.parse(read(file));
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const slash = file => file.replaceAll('\\', '/');
const review = json('third-party/release-review.json');
const assets = json('backend/obj/project.assets.json');
const lock = json('package-lock.json');
const target = assets.targets['net48/win-x86'] || assets.targets.net48;
if (!target) throw Error('Restore backend/Step7Bridge.csproj for net48 first.');
const toolbox = 'DotNetProjects.DotNetSiemensPLCToolBoxLibrary';
const notices = {
  [toolbox]: ['Toolbox.LICENSE.txt', 'Toolbox.LGPL-3.0.txt', 'Toolbox.UPSTREAM-README.md', 'Toolbox.source-headers.txt', 'Toolbox.package.nuspec', 'Toolbox.csproj.txt'],
  SharpZipLib: ['SharpZipLib.LICENSE.txt'],
};
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const file = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(file) : [file];
});
const nuget = Object.entries(target).map(([id, value]) => {
  const split = id.lastIndexOf('/'), name = id.slice(0, split), version = id.slice(split + 1);
  const runtime = Object.keys(value.runtime || {}), resources = Object.keys(value.resource || {});
  const library = assets.libraries[id];
  const cache = Object.keys(assets.packageFolders).map(dir => path.join(dir, library.path)).find(dir => fs.existsSync(dir));
  if (!cache) throw Error('Missing restored NuGet package: ' + id);
  const nuspec = fs.readFileSync(path.join(cache, name.toLowerCase() + '.nuspec'), 'utf8');
  const tag = name => nuspec.match(new RegExp(`<${name}(?:\\s[^>]*)?>([^<]*)</${name}>`))?.[1];
  if (runtime.length && !notices[name] && !['System.Buffers', 'System.Memory', 'System.Numerics.Vectors', 'System.Runtime.CompilerServices.Unsafe', 'System.Threading.Tasks.Extensions'].includes(name)) throw Error('Review required for new runtime component: ' + id);
  const licenseFiles = notices[name] || (runtime.length ? [name + '.LICENSE.TXT', name + '.THIRD-PARTY-NOTICES.TXT'] : []);
  if (name.startsWith('System.')) for (const legal of ['LICENSE.TXT', 'THIRD-PARTY-NOTICES.TXT']) {
    if (!fs.readFileSync(path.join(cache, legal)).equals(read('third-party/' + name + '.' + legal))) throw Error('Original NuGet legal file changed: ' + name + '.' + legal);
  }
  return {
    name, version, scope: runtime.length ? 'runtime' : 'build-only',
    declaredLicense: tag('license') || tag('licenseUrl') || 'UNKNOWN',
    authors: tag('authors'), copyright: tag('copyright'),
    repository: nuspec.match(/<repository[^>]*url="([^"]+)"/)?.[1],
    commit: nuspec.match(/<repository[^>]*commit="([^"]+)"/)?.[1],
    nugetContentHash: library.sha512,
    shippedFiles: [...runtime, ...resources].map(file => {
      const relative = file.split('/').slice(2).join('/');
      const contents = fs.readFileSync(path.join(cache, file));
      const built = read('backend/bin/' + relative);
      if (!contents.equals(built)) throw Error('Built dependency differs from NuGet: ' + relative);
      return { path: 'backend/bin/' + relative, packagePath: file, sha256: hash(contents) };
    }),
    notices: licenseFiles.map(file => ({ path: 'third-party/' + file, sha256: hash(read('third-party/' + file)) })),
    review: name === toolbox ? 'unresolved; see release-review.json' : runtime.length ? 'MIT with original additional notices preserved' : 'external build tool; not redistributed',
  };
}).sort((a, b) => a.name.localeCompare(b.name, 'en'));

const sections = [];
const npm = Object.entries(lock.packages).filter(([location]) => location).map(([location, value]) => {
  const dir = path.join(root, location), installed = fs.existsSync(dir);
  const name = value.name || location.split('node_modules/').at(-1);
  const licenseFiles = installed ? fs.readdirSync(dir).filter(file => /^(licen[cs]e|copying|notice|thirdpartynotice)([.\-_]|text|$)/i.test(file) && fs.statSync(path.join(dir, file)).isFile()).sort() : [];
  const attributionFiles = installed && !licenseFiles.length ? fs.readdirSync(dir).filter(file => /^(readme([.]|$)|package[.]json$)/i.test(file)) : [];
  for (const file of [...licenseFiles, ...attributionFiles]) sections.push(`\n${'='.repeat(80)}\n${name}@${value.version} — ${location}/${file}\n${'='.repeat(80)}\n`, fs.readFileSync(path.join(dir, file)), '\n');
  if (value.license?.startsWith('SEE LICENSE') && !name.startsWith('@vscode/vsce-sign')) throw Error('Review required for custom license: ' + name);
  return {
    name, version: value.version, location, scope: 'development-only', bundled: false,
    declaredLicense: value.license || 'UNKNOWN',
    ...(value.license?.startsWith('SEE LICENSE') ? { licenseInterpretation: 'LicenseRef-Microsoft-VSCE-Sign; proprietary development-use terms, not MIT' } : {}),
    integrity: value.integrity, resolved: value.resolved, optional: !!value.optional,
    ...(value.os ? { os: value.os } : {}), ...(value.cpu ? { cpu: value.cpu } : {}),
    inspection: !installed ? 'not installed on this host; optional platform package; metadata only' : licenseFiles.length ? 'package license/notice files recorded verbatim' : 'metadata only; no standalone legal file found at package root',
    licenseFiles: licenseFiles.map(file => ({ path: location + '/' + file, sha256: hash(fs.readFileSync(path.join(dir, file))) })),
    ...(attributionFiles.length ? { attributionFiles: attributionFiles.map(file => ({ path: location + '/' + file, sha256: hash(fs.readFileSync(path.join(dir, file))) })) } : {}),
  };
});
const inventory = {
  schema: 1, reviewDate: review.reviewDate,
  description: 'Dependency inventory, not a legal clearance or a CycloneDX/SPDX SBOM. Third-party licenses do not change under the root MIT license.',
  packageLockSha256: hash(read('package-lock.json')),
  nuget, npm,
  generatedCodeNotices: ['third-party/TypeScript.LICENSE.txt', 'third-party/TypeScript.ThirdPartyNoticeText.txt'].map(file => ({ path: file, sha256: hash(read(file)) })),
};
for (const [original, copy] of [['LICENSE.txt', 'TypeScript.LICENSE.txt'], ['ThirdPartyNoticeText.txt', 'TypeScript.ThirdPartyNoticeText.txt']]) {
  if (!read('node_modules/typescript/' + original).equals(read('third-party/' + copy))) throw Error('Original TypeScript legal file changed: ' + copy);
}
const content = JSON.stringify(inventory, null, 2) + '\n';
const developmentNotices = Buffer.concat([
  Buffer.from('Installed development dependencies only. These packages are excluded from VSIX.\nOriginal legal files follow verbatim; separators are generated by Step7Project.\nSee inventory.json for versions, hashes, and uninstalled optional packages.\n'),
  ...sections.map(part => Buffer.isBuffer(part) ? part : Buffer.from(part)),
]);
if (process.argv.includes('--write')) {
  fs.mkdirSync(path.join(root, 'third-party/development'), { recursive: true });
  fs.writeFileSync(path.join(root, 'third-party/inventory.json'), content);
  fs.writeFileSync(path.join(root, 'third-party/development/npm-notices.txt'), developmentNotices);
  console.log('Updated inventory and development notices. This does not close release-review issues.');
} else {
  if (!read('third-party/inventory.json').equals(Buffer.from(content))) throw Error('Dependency inventory changed. Review changes, then run npm run licenses:inventory.');
  if (!read('third-party/development/npm-notices.txt').equals(developmentNotices)) throw Error('Development notices changed. Review changes, then run npm run licenses:inventory.');
}
const known = new Set(nuget.flatMap(component => component.shippedFiles.map(file => file.path)));
for (const file of walk(path.join(root, 'backend/bin'))) {
  const relative = slash(path.relative(root, file));
  if (/\/Debug\//i.test(relative) || /\/libnodave_[^/]*\.dll$/i.test(relative)) continue;
  if (/\.dll$/i.test(relative) && !known.has(relative)) throw Error('Uninventoried packaged DLL: ' + relative);
}
if (review.schema !== 1 || !Array.isArray(review.issues)) throw Error('Unsupported release-review format');
const unresolved = review.issues.filter(issue => issue.status !== 'resolved');
console.log(`Inventory verified: ${nuget.filter(x => x.scope === 'runtime').length} runtime NuGet packages, ${nuget.filter(x => x.scope === 'build-only').length} build-only NuGet packages, ${npm.length} npm lockfile entries.`);
for (const issue of unresolved) console.log(`OPEN ${issue.id}: ${issue.reason}`);
if (process.argv.includes('--release') && unresolved.length) {
  console.error('Release packaging is blocked by unresolved third-party review. See docs/LICENSING.md. Build, compile and local tests remain available.');
  process.exitCode = 1;
}
