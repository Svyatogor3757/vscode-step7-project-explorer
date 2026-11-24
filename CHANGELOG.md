# Changelog

**English** | [Русский](CHANGELOG.ru.md)

## Unreleased

- Added English-default and Russian README/changelog files with language links. Agent instructions remain a single English AGENTS.md to avoid conflicting copies.
- Made the agent usage guide, translation guide and generated project AGENTS.md English by default, retaining Russian guide companions. Automatic selection includes saved personal translations, falls back to English for unsupported locales, and preserves explicit choices.
- Added version-tag and draft-release automation with Windows build/test checks, VSIX verification and SHA-256 checksums. Release packaging remains subject to the Toolbox licensing review.
- Added MIT and third-party license links and a trademark/independence disclaimer at the end of README. Product names identify compatibility.
- Moved translation sources to `language/interface_en_us.json` and `interface_ru_ru.json`. Bundled languages are discovered during builds; `package.nls*.json` is generated from those sources.
- Added interface language selection and personal translation import without rebuilding. Missing translations fall back to English. User translations live outside the installation directory; invalid JSON and placeholders are rejected.
- Fixed settings dropdown labels while preserving their stored technical values.
- Routed VSIX output to `releases/` and updated package/upgrade verification paths.
- Attributed original MIT code to Cody / Svyatogor3757; added AUTHORS.md, licensing guidance and dependency attribution.
- Preserved complete upstream license/notice files and a separate development-tool collection. Added NuGet/npm inventory and DLL/legal-file hashes; development-only notices are excluded from VSIX.
- Disabled Git text normalization for third-party legal files to preserve original CRLF/BOM bytes and checksums.
- Pinned Toolbox 4.4.10 source as a submodule. Documented per-component MIT/LGPL/Library GPL/CPOL notices and nuances. Identified the original Brian Duke DBF code as CPOL 1.02 from archived primary sources and preserved the license. Compatibility and corresponding-source distribution remain unconfirmed; new release packaging is blocked pending documented resolution. Local compilation and tests remain available.

## 0.1.3 — 2026-11-24

- Native-project and project-view links now open VS Code Explorer. The most specific existing containing workspace root is reused, or the required folder is added without replacing other roots.
- Folder navigation waits for VS Code confirmation. Pending navigation can survive an Extension Host restart from an empty or single-folder window. Cancelled or removed folders are not reopened automatically.
- Fixed active-view selection after adding a folder. Missing locations report an error instead of revealing an unrelated root.
- Removing the last workspace folder containing a view closes its project connection. Closed projects are not retained outside the workspace. Windows Explorer remains an explicit context action.

## 0.1.2 — 2026-11-23

- Removed the permanent “Save files → Check changes…” banner above the tree.
- Added Show Project Controls to the command palette and tree toolbar, revealing controls without resetting other VS Code panels.
- Explicitly localized both view titles and verified startup with a profile previously used by 0.1.0.
- Clarified Reload Window after a VSIX update; project Refresh does not reload registered extension views.

## 0.1.1 — 2026-11-23

- Removed the Step7Project command prefix and added English/Russian localization following VS Code's display language.
- Introduced separate Project Controls and Project views with all five primary actions available as rows.
- Displayed the active native project and view with full-path tooltips, navigation and path-copy actions. Multiple projects support explicit selection and switching by the active editor.
- Automatically discover workspace views using step7project.json. Open accepts a native project or a view manifest; known mappings are stored only in extension user state.
- New views prefer relative native-project paths where possible. Added relative/absolute path settings and CLI configuration while preserving existing absolute references. Generated launchers are rebound without overwriting custom scripts.
- Simplified new Symbols filenames to Symbols.csv/ASC. Legacy names can be migrated by reselecting their format after closing editors, preserving pending changes and refusing existing destinations.
- Strengthened source-name checks: 24-character limit, Windows names/characters and program-local duplicates. Source renaming preserves block numbers and code references. Fixed DB creation after cancelling its type selection.

## 0.1.0 — 2026-11-21

- Added the Step7Project sidebar for CPU programs, Sources, Blocks and Symbols.
- Added UTF-8 project-view files, agent-friendly paths, CLI and AGENTS.md instructions.
- Added OB/FC/FB/DB/UDT source creation, compilation, source renaming and explicit deletion.
- Added CSV/ASC and a Symbols table editor, including VAT references without a data type.
- Added backup schedules, restore-to-new-folder, staging, conflicts and recovery barriers.
- Added the x86 STEP 7 Classic backend and interactive-desktop bridge for Windows Remote SSH.
- Added per-project English/German AWL mnemonics.
- Protected symbol tables with additional native attributes through read-only access to avoid data loss.
