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

1. Resolve `third-party/release-review.json` findings with documented grounds and completed distribution requirements. Do not remove findings or bypass the gate.
2. Update package.json and package-lock.json versions together. Add versioned sections to both changelogs; maintain both README files. Review dependency/lockfile changes before updating inventory; inventory regeneration is not legal approval.
3. Complete required checks and commit reviewed source. The English changelog section supplies release notes.
4. Create an annotated `vX.Y.Z` tag on that commit and push main plus the new tag. Never reuse a published tag.

The build validates tag syntax, manifest version and exact checkout; restores/builds/tests; enforces `licenses:check`; packages into releases/; verifies the archive; and creates SHA256SUMS.txt. A separate job with `contents: write` checks the downloaded artifact checksum and creates a **draft** containing the VSIX and checksums. Existing releases are not overwritten.

Review artifacts, notes, checksums and licensing evidence before publishing a draft. Open licensing findings prevent publication. There is no automatic Marketplace publication or stored Marketplace token.

While the current Toolbox review remains open, new release packaging is expected to fail at the licensing check. Main-branch builds, tests and technical inventory checks remain available.
