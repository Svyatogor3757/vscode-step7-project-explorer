# Agent workflow

**English** | [Русский](AGENT-USAGE.ru.md)

## Connect to a project

The user selects a prepared `.s7p` with **Project Controls → Open Project**. The extension creates a `<name>-code` view containing ordinary files and adds it to the workspace. Existing views can be opened by their `step7project.json`; views inside workspace folders are discovered automatically. An agent needs directory and terminal access on the Windows host with STEP 7. With Remote SSH, install the extension on that host; it needs no separate SSH configuration.

The manifest's `project` can be relative to its directory. The CLI resolves it independently of the terminal's current directory; `status.project` and `status.workspace` are absolute. For an existing view, `configure --workspace . --project-path relative` stores a portable reference, while `absolute` stores an absolute path. Different drives require an absolute path. The reverse index is extension user state and is unnecessary when transferring directories. Opening a transferred view rebinds a recognized generated launcher; custom scripts and existing AGENTS.md are preserved.

For native writes, open the project in SIMATIC Manager at least once so it appears in the Command Interface collection. The backend identifies it by exact directory path, rather than its display name alone. Remote SSH writes require a signed-in Windows desktop session for the same user; the desktop bridge uses a temporary scheduled task. No password or PLC connection needs to be supplied.

## Edit, check and apply

Run these commands in the exported view:

```powershell
.\step7project.cmd doctor --json
.\step7project.cmd status --workspace . --json
```

From the extension source repository, the same CLI is `node bin/step7project.cjs`. For an installed extension, use `node "<extension>/bin/step7project.cjs"`. `--backend` overrides the path to `Step7Bridge.exe`, on the same host as the project and STEP 7.

Select the complete CPU-program ID from `status.programs`. Use `status.changes` for the file path and state. Read the file and its dependencies, edit with normal file/patch tools, and save UTF-8. The user can copy an exact file path from the Step7Project tree context menu.

```powershell
.\step7project.cmd status --workspace . --json
.\step7project.cmd check --workspace . --json
.\step7project.cmd apply --workspace . --json
.\step7project.cmd status --workspace . --json
```

`check` creates a separate native project and uses COM `Copy` to copy the affected S7 programs. It checks their blocks and symbols without connecting hardware. `apply` repeats staging, checks external changes, snapshots the native project if backup is enabled, performs import/compilation, and compares re-export with the staged result. The returned `stage` path supports diagnosis; temporary test directories are not automatically deleted.

The CLI returns JSON and exit code 0 on success or 1 on failure. `--json` is accepted explicitly; JSON is also the default. A subset of newly created blocks after a failure is not a successful apply.

## Create, rename and delete

```powershell
.\step7project.cmd create --workspace . --program "Station\CPU\Program" --type FC --number 901 --language scl
.\step7project.cmd create --workspace . --program "Station\CPU\Program" --type DB --number 902 --language scl --instance-of "FB 20"
.\step7project.cmd rename --workspace . --file "Programs/Station/CPU/Program/Sources/Old.scl" --name New
.\step7project.cmd delete --workspace . --file "Programs/Station/CPU/Program/Blocks/FC/FC901.Name.awl"
```

Supported types are OB, FC, FB, DB and UDT; languages are scl/awl. The STEP 7 compiler validates numbers for the particular CPU. `create` creates a source; applying it compiles a block. An unapplied new source can be cancelled with `delete`.

`rename` changes the Sources object name, with a 1–24 character limit. STEP 7 updates native metadata during Apply. Function/FB identifiers and references inside the text are not automatically renamed. File-renaming DB117.awl does not migrate its block number. Change its symbolic name in Symbols; changing the number requires a new block and reference migration. A filename, source name, block number and symbol are separate identifiers.

Sources and compiled blocks are separate objects. Deleting a source leaves its blocks; explicitly select blocks when removing them too. A batch mixing Sources changes with direct Blocks changes in the same program is rejected; apply these separately. Use `create` for new objects instead of expecting files added manually to be imported automatically.

## Mnemonics and selected files

AWL export must match **STEP 7 → Options → Customize → Language**. English mnemonics are the default. To change them with no pending edits:

```powershell
.\step7project.cmd configure --workspace . --mnemonics german
.\step7project.cmd refresh --workspace .
```

Use `english` to switch back. This changes exported block text; existing Sources text is not translated. Do not silently change the dialect to bypass compiler errors. `check` and `apply` accept `--file "Programs/..."` for a selected object and preserve other local changes. Applying one source may regenerate multiple blocks, so conflict checks cover the affected program.

## Symbols

CSV columns are `symbol,address,type,comment`. Use a CSV parser; comments can contain commas and quotes. ASC uses a `126,` prefix and field widths of 24/12/10/80 characters. Project-view text is UTF-8; the native encoding is recorded in the manifest. Unrepresentable characters stop import. VAT symbol entries may have an empty type.

```powershell
.\step7project.cmd symbols-format --workspace . --format asc
.\step7project.cmd symbols-format --workspace . --format csv
```

Format changes require a clean table with no pending edits. `step7project.symbols.editor` selects the built-in table, text editor or default editor, including third-party CSV extensions.

New files use Symbols.csv/ASC. Legacy Symbols.symbols.csv is supported; reselecting the current format simplifies its suffix when the table is unchanged and the destination is free. Close its VS Code editors first. Do not rename a managed file manually; its path is bound to its manifest entry.

Tables with additional native attributes are read-only because CSV/ASC cannot guarantee their preservation. `status` gives the reason. Incomplete rows are exported for inspection, but import requires mandatory fields. The table object cannot be deleted; remove its rows to create an empty table.

## Backups and failures

```powershell
.\step7project.cmd configure --workspace . --backup-mode everySave
.\step7project.cmd backups --workspace .
.\step7project.cmd restore --backup "C:/Backups/..." --destination "C:/Restored/NewProject"
```

Modes are off/everySave/1m/10m/30m/1h. Enabled modes preserve previously observed project-view file versions and snapshot the native project before Apply. External-write history requires the extension to be running; watchers can combine rapid writes. Snapshots are not automatically pruned by age.

A native write failure sets `recovery`, blocks subsequent applies and preserves local edits. Read diagnostics, inspect the project in SIMATIC Manager, and restore a snapshot into a new directory if necessary. After inspection, the operator can use `recover --workspace . --acknowledge-native-state` to acknowledge the actual native state. This does not roll back the project. Do not remove a lock belonging to another or still-running process.

In the final report, list changed files/blocks, Check and Apply results, backup location, and checks not performed. Successful import does not establish correct operation on hardware.

## Why the workflow uses AGENTS.md

[AGENTS.md](https://agents.md/) provides a predictable place for project context, commands and rules. [Codex documentation](https://learn.chatgpt.com/docs/agent-configuration/agents-md) explains instruction discovery from the root to the working directory. The extension therefore creates AGENTS.md at the root of exported sources and preserves existing instructions. The document does not register a tool API with a model; [VS Code Language Model Tools](https://code.visualstudio.com/api/extension-guides/ai/tools) are a separate mechanism. Files and CLI work with Codex and other agents that have terminal access.
