# Contributing to Step7ProjectExplorer

**English** | [Русский](CONTRIBUTING.ru.md)

Propose changes with a **pull request**. You do not need write access to this repository: work in your own fork and target this repository's `main` branch. [Cody / @Svyatogor3757](https://github.com/Svyatogor3757) reviews contributions and decides which changes to merge. Opening a PR does not change the main codebase.

## Propose a change

1. Check [existing issues](https://github.com/Svyatogor3757/vscode-step7-project-explorer/issues) and [pull requests](https://github.com/Svyatogor3757/vscode-step7-project-explorer/pulls). For a large change, an issue helps agree on the scope before implementation.
2. Click **Fork**, clone your fork and create a branch:

   ```powershell
   git clone https://github.com/YOUR-USERNAME/vscode-step7-project-explorer.git
   cd vscode-step7-project-explorer
   git switch -c fix/short-description
   ```

3. Make a focused change. Keep unrelated fixes in separate PRs.
4. Run the checks relevant to your change, then commit and push the branch to your fork.
5. On GitHub, select **Contribute → Open pull request**. The base is `Svyatogor3757/vscode-step7-project-explorer:main`; the head is your fork's branch. Explain the problem, the change and what you checked. Use a draft PR for unfinished work.

The owner can request revisions. Push updates to the same branch to update the PR; do not open a new PR for each revision. For GitHub's instructions, see [Creating a pull request from a fork](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-a-pull-request-from-a-fork).

## Build and validation

Code changes are developed and checked on **Windows**, using Node.js 22 and a .NET SDK capable of building the .NET Framework 4.8 x86 backend. CI currently uses .NET SDK 10. STEP 7 is not needed to compile the extension.

```powershell
npm ci
npm run build:backend
npm test
npm run licenses:audit
```

For translation changes, edit `language/interface_*.json` and run `npm run languages:generate`; commit the generated dictionaries too. Do not edit `package.nls*.json` directly. Keep the displayed name **Step7ProjectExplorer** unchanged in every language.

For documentation-only changes, check links and the matching language version; a full local backend build is not required. The PR's CI still runs automatically, or after the maintainer approves a first-time contributor's workflow run.

Native write changes need a real **import → compile → export** check with STEP 7 V5.5 SP3 / S7-300 on a disposable project. State the tested version and the result. Node tests and mocks do not establish STEP 7 or PLC compatibility. Never test writes on a user's working project or edit native DBF/DBT/MDX files directly.

## Documentation and licensing

Keep README.md / README.ru.md and CHANGELOG.md / CHANGELOG.ru.md aligned. User-facing documents default to English; update the Russian companion when one exists. Agent workflow details are in [docs/AGENT-USAGE.md](docs/AGENT-USAGE.md); repository development instructions are in [AGENTS.md](AGENTS.md).

Your original contributions are submitted under the project's [MIT license](LICENSE). Preserve existing copyright notices. Third-party code keeps its own terms: include provenance, license texts and attribution when adding or changing a dependency. Read [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) and [docs/LICENSING.md](docs/LICENSING.md); local packaging does not resolve open distribution-review findings.

Do not commit real PLC project archives, credentials, Siemens DLLs, `node_modules` or generated VSIX files. Use synthetic fixtures and keep local builds in the ignored `releases/` directory. The pinned Toolbox submodule must not be updated automatically.

## Review and merging

`main` accepts changes through PRs. Contributions require the code owner's approval, resolved review conversations and the successful GitHub Actions **windows** check. A new push dismisses previous approvals, so the owner reviews the current revision. Automatic merging is disabled; contributors are not granted upstream write access by opening a PR.

The owner has a PR-only review bypass for their own changes, because GitHub does not allow authors to approve their own PRs. This exception does not permit direct pushes to `main`, bypass its separate CI rule, or allow force-pushing or deleting it. See [maintainer settings](docs/CONTRIBUTION-MAINTENANCE.md).
