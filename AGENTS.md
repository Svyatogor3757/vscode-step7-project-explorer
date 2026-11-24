# Step7Project: instructions for AI agents

## Using the tool

Step7Project is a Windows VS Code extension for STEP 7 Classic V5.5 SP3 / S7-300. An agent's primary interface is the exported project view's ordinary UTF-8 files and CLI. No model-specific integration is required.

For PLC program work, use the connected directory containing `step7project.json`, rather than this extension's source repository. Read that directory's local `AGENTS.md`. Paths copied from the tree are ordinary file paths; use standard file-reading/editing tools. The generated `step7project.cmd` invokes the installed CLI with a suitable Node/Electron runtime.

```powershell
.\step7project.cmd status --workspace . --json
# Edit the selected file under Programs/...
.\step7project.cmd check --workspace . --json
.\step7project.cmd apply --workspace . --json
.\step7project.cmd status --workspace . --json
```

Saving changes the editable text. `check` compiles copies of the affected S7 programs in a separate TEMP project. `apply` repeats staging, imports changes into the native project and verifies re-export. Run Apply when native-project writes are authorized by the user's task. Do not describe a local edit as a successful native import or PLC verification.

`status` exposes full program identifiers, paths, states and read-only reasons. Different CPUs can have identically named programs and block numbers. Edit SCL under Sources; its Blocks representation is not the original SCL. Symbols has one canonical CSV or ASC file. Create, rename and delete through the CLI, then apply separately. Commands, backup and recovery: [docs/AGENT-USAGE.md](docs/AGENT-USAGE.md).

Never edit native DBF/DBT/MDX files directly. Preserve block protection, read-only access, conflicts and recovery barriers. Hardware, NetPro, connections and PLC downloads are outside scope. Do not delete unknown blocks or symbols. Deleting a source does not delete its compiled blocks.

The manifest's `project` may be relative to its directory; `status.project` and `status.workspace` are resolved absolute paths. For portability with a native project, use `configure --workspace . --project-path relative`. Known-view indexes belong only to extension user state. `rename` changes a Sources object name; function identifiers and DB numbers stay unchanged. Symbolic block names belong in Symbols. Changing a block number requires a separate reference migration.

## Developing the extension

Toolbox source is the `third-party/sources/Toolbox` submodule, pinned at `f0b2c5a98fe3e1b71861cd47403aac02338efc99` from NuGet 4.4.10 metadata. Initialize it with `git submodule update --init --recursive`; do not automatically update to master. See [per-component licenses and nuances](third-party/Toolbox.COMPONENTS.md). Archived primary sources identify the original DBF fragment as CPOL 1.02. Do not present the entire tree as MIT or as uniformly LGPL. The backend still uses NuGet. Switching to a source build, introducing patches or changing the pinned commit requires explicit documentation and verification. Exclude the full upstream checkout from VSIX; it contains external binaries and unrelated upstream applications.

- `src/`: TypeScript extension, Symbols editor, project views, backup and CLI.
- `backend/`: .NET Framework 4.8 x86; DotNetSiemensPLCToolBoxLibrary for reading and STEP 7 Command Interface for writes. `Invoke-Bridge.ps1` runs native compilers in an interactive Windows session over Remote SSH.
- `test/`: Node built-in tests. `tools/`: reproducible verification and VM scripts. `Examples/` and remaining `S-15/` are ignored user examples.
- `language/interface_*.json`: translation sources, including en_us and ru_ru. Generate root `package.nls*.json` with `npm run languages:generate`; do not edit generated dictionaries. Partial translations fall back to English; preserve placeholders. Personal imports need no rebuild: [language/README.md](language/README.md).
- `releases/`: local VSIX outputs. Versioned binaries belong in GitHub Releases, rather than Git history.

```powershell
npm ci
npm run build:backend
npm test
npm run package
```

Do not modify user examples to test writes. Use fresh `%TEMP%` directories on `vmware-siemens` only when the user authorizes that machine. Do not stop shared Siemens processes. Every newly writable native format must pass a real import → compile → export cycle. Mocks validate extension logic, not STEP 7 compatibility.

Preserve exact native identifiers, encodings and CPU boundaries. Never report success after partial writes or lost data. Record failures and completed checks in [docs/VERIFICATION.md](docs/VERIFICATION.md).

User-facing documentation defaults to English. Keep [README.md](README.md) and [README.ru.md](README.ru.md) aligned, including their English/Russian navigation links. Document every user-facing change in both [CHANGELOG.md](CHANGELOG.md) and [CHANGELOG.ru.md](CHANGELOG.ru.md). [docs/AGENT-USAGE.md](docs/AGENT-USAGE.md) must be English; maintain its Russian companion when changing the workflow. Internal developer references and the single verification journal under `docs/` may remain Russian. Keep AGENTS.md as one English instruction set to avoid conflicting language copies.

For interface localization, automatic mode follows the detected VS Code display language when a matching bundled or imported language is available; otherwise it falls back to English. Preserve explicit user choices. Cover unsupported locales and partial-translation fallback when changing this behavior.

## Licensing and releases

Original code is Copyright Cody ([Svyatogor3757](https://github.com/Svyatogor3757)), under MIT. Preserve the copyright and complete LICENSE. Third-party components retain their own licenses. Before dependency updates or releases, read [docs/LICENSING.md](docs/LICENSING.md), review [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md), and run `npm run licenses:audit` / `npm run licenses:check`.

Open Toolbox findings in `third-party/release-review.json` block release packaging. Do not delete findings or disable the check to release a build. Resolution requires documented licensing grounds and, for LGPL distribution, completed source-delivery and replacement/relink requirements. `licenses:inventory` records facts without approving terms. Exclude node_modules, signing tools, Siemens DLLs and examples from VSIX. Preserve original legal-file bytes and formatting.

Use [docs/RELEASING.md](docs/RELEASING.md) for tag/version mapping, CI and release drafts. Historical tags must identify their actual source commits. Never overwrite published tags or release assets. Do not publish a draft while its licensing review remains unresolved.

## Why these instructions use files and CLI

The root file keeps the workflow short and links to details, following the purpose of [AGENTS.md](https://agents.md/) and [Codex agent configuration](https://learn.chatgpt.com/docs/agent-configuration/agents-md). This file describes available tools; it does not register tools with an AI model. VS Code also supports [Language Model Tools](https://code.visualstudio.com/api/extension-guides/ai/tools), while this extension uses files and CLI for compatibility with terminal-based agents.
