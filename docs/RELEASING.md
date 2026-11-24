# Releases and CI

This guide is for maintainers. User instructions: [English README](../README.md) / [Русский](../README.ru.md).

## Versions and historical builds

Tags use `vX.Y.Z` and identify the actual source for that version. Published tags and assets are immutable by project policy. Main contains development and Unreleased changes; it is not retroactively tagged as an older release.

| Tag | Source commit | Existing artifact |
| --- | --- | --- |
| `v0.1.0` | `614a89b` | `step7project-0.1.0.vsix` |
| `v0.1.1` | `5c84596` | `step7project-0.1.1.vsix` |
| `v0.1.2` | `7f0e340` | `step7project-0.1.2.vsix` |
| `v0.1.3` | `134f040` | `step7project-0.1.3.vsix` |

Historical binaries are preserved as supplied, with identity/version checks, comparison of JavaScript to compiled tagged sources, and SHA-256 checksums. This does not establish native-backend bit-for-bit reproducibility or resolve licensing findings. They are stored in **draft** GitHub Releases for maintainer review. Draft assets are not public downloads; maintainers with push access can inspect them.

Full source commits, artifact sizes and hashes are recorded in [RELEASE-ARCHIVE.json](RELEASE-ARCHIVE.json).

Local binaries belong in ignored `releases/`; release assets belong in [GitHub Releases](https://github.com/Svyatogor3757/vscode-step7-project-explorer/releases). Do not commit archives into source history. Tags predating the Toolbox submodule do not contain its later checkout; pinned source and licensing evidence remain available on main.

## CI checks

`.github/workflows/ci.yml` runs on main pushes, pull requests and manual dispatch. Windows installs Node.js 22 and .NET SDK 10, restores dependencies, builds the x86 backend, runs Node tests, and checks dependency inventory and generated localization. Actions are pinned to full commit hashes.

Hosted CI has no STEP 7, PLC, interactive Siemens compiler session, user example projects or Russian VS Code language pack. Passing CI does not replace VM import → compile → export checks or local English/Russian Extension Host verification.

Package-check fixtures are private temporary ZIPs without a VSIX manifest, not installable releases. They exercise archive guards and the packaged backend doctor. `tools/verify-package.ps1 -SkipExample` skips only the ignored user example export; identity, required files, dependency/license hashes and architecture checks remain enabled. Local verification can also export the real example when supplied.

## New tagged releases

The release workflow runs on `v*` pushes or manual dispatch with an existing tag. Historical tags have no workflow in their source commits, so preserved historical drafts are handled separately. Never rebuild an old tag from a different source tree.

1. Review `third-party/release-review.json` and retain open findings, dependency notices and applicable license texts. Local packaging and draft preparation do not require pretending that distribution review is complete. Use `npm run licenses:check` separately to assess that review; do not mark findings resolved without evidence.
2. Update package.json and package-lock.json versions together. Add versioned sections to both changelogs; maintain both README files. Review dependency/lockfile changes before updating inventory; inventory regeneration is not legal approval.
3. Complete required checks and commit reviewed source. The English changelog section supplies release notes.
4. Create an annotated `vX.Y.Z` tag on that commit and push main plus the new tag. Never reuse a published tag.

The build validates tag syntax, manifest version and exact checkout; restores/builds/tests; runs `licenses:audit`; packages into releases/; verifies the archive; and creates SHA256SUMS.txt. Inventory mismatches fail the build; open legal findings remain visible warnings. A separate job with `contents: write` checks the downloaded artifact checksum and creates a **draft** containing the VSIX and checksums. Existing releases are not overwritten.

Review artifacts, notes, checksums and licensing evidence before deciding whether to publish a draft. Local packaging and draft creation do not establish distribution compliance. There is no automatic public release or Marketplace publication, and no stored Marketplace token.

Our original code remains MIT. Each dependency retains its own licenses, attribution and review notes. The local packaging workflow preserves these files and reports unresolved review items without imposing a blanket packaging ban.

## Local build 0.1.4

On 2026-11-24 the user explicitly authorized removal of the internal local-packaging restriction, requested version 0.1.4 and reserved all GitHub pushes for themselves. The normal `npm run package` now builds and audits the package; no direct VSCE pack workaround is needed. Keep all license findings and original notices. Prepare the local commit and annotated `v0.1.4` tag, then provide these commands without running them:

```powershell
git push --atomic origin main v0.1.4
```

The tag triggers CI and draft-release preparation. The VSIX stays out of Git history. If a draft for this tag already exists, the workflow refuses to overwrite it.
