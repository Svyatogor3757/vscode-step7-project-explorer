import path from 'node:path';
import fs from 'node:fs';
import {atomic,inside} from './storage';
export function agentGuide():string {
 return `# Working with STEP 7 through Step7ProjectExplorer

This directory is an editable view of a native STEP 7 Classic project. Files under Programs are available to ordinary reading, search and editing tools. Saving text does not apply changes to STEP 7.

## Commands

Run from this directory on the Windows project host, including a VS Code Remote SSH terminal:

\`\`\`powershell
.\\step7project.cmd doctor --json
.\\step7project.cmd status --workspace . --json
.\\step7project.cmd check --workspace . --json
.\\step7project.cmd apply --workspace . --json
\`\`\`

The CLI returns JSON. Exit code 0 means success; a nonzero code means failure. Check creates a separate STEP 7 test project and compiles program copies. Apply repeats checks, then writes the native project. Native writes require STEP 7 and a project previously opened in SIMATIC Manager. With Remote SSH, sign in to Windows as the same account: STEP 7 compilers use the interactive desktop session.

The project field in step7project.json may be relative to the manifest directory. status.project and status.workspace are absolute. To move both directories together, use configure --workspace . --project-path relative; absolute stores an absolute reference. Do not resolve project against the terminal directory. Open a transferred view or its JSON in the extension to rebind the generated CLI launcher; custom scripts are preserved.

## Workflow

1. Run status. Identify the program by its full ID: different CPUs can share filenames and block numbers.
2. Read and edit the ordinary file whose path the user copied from Step7ProjectExplorer. Edit SCL in Sources; Blocks is a separate representation of compiled blocks.
3. Save UTF-8. Preserve the symbols CSV header symbol,address,type,comment, quoting and unaffected rows. VAT can have an empty type. ASC has fixed-width fields.
4. Run status and check. Resolve compiler errors and conflicts. Edit original SCL sources rather than their compiled representation.
5. Run apply when the task authorizes native-project writes. Otherwise retain local edits and report them as unapplied.
6. Repeat status and inspect the result. Distinguish text edits, successful compilation of a copy and verified native Apply. No PLC verification is implied.

## Structural changes

\`\`\`powershell
.\\step7project.cmd create --workspace . --program "Station\\CPU\\Program" --type FC --number 901 --language scl
.\\step7project.cmd create --workspace . --program "Station\\CPU\\Program" --type DB --number 902 --language scl --instance-of "FB 20"
.\\step7project.cmd rename --workspace . --file "Programs/.../Sources/Name.scl" --name NewName
.\\step7project.cmd delete --workspace . --file "Programs/.../Blocks/FC/FC901.Name.awl"
\`\`\`

Use exact --program values from status.programs and --file paths from status.changes. Create adds source text; compilation creates blocks. Deleting a source leaves its compiled blocks; delete blocks separately. A missing local file is not permission to delete its native object. Apply Sources changes and direct Blocks changes in the same program as separate batches.

Rename changes a Sources object name (1–24 characters), not function identifiers inside it. Do not rename DB/FB/FC objects by moving files. Symbolic names belong in Symbols; block-number changes require a separate reference migration. Legacy Symbols.symbols.csv is supported. To migrate a clean table to Symbols.csv, close its editors and run symbols-format --workspace . --format csv; an existing destination is not overwritten.

## Limits and recovery

- Do not edit native DBF/DBT/MDX files, hardware, networks or PLC connections.
- AWL uses status.awlMnemonics, matching STEP 7 Options > Customize > Language. With no pending edits, use configure --workspace . --mnemonics english or german, then refresh --workspace .; existing Sources text is not translated.
- Preserve readOnly and know-how protection. Use an available original source. SFC/SFB and unsupported formats are read-only.
- Do not edit step7project.json to bypass conflicts or remove another process's write lock.
- On recovery, stop new applies. Read diagnostics, inspect the snapshot and actual project state. Restore only into a new location. After deliberate operator review, use recover --acknowledge-native-state, then status/refresh and check again.
- Backup defaults to everySave. External writes are observed while the extension is active; closed VS Code cannot retain every external save. Enabled modes snapshot the native project before Apply. Off disables persistent automatic backups.
- Preserve an existing AGENTS.md. Reconnect transferred views to rebind the CLI to the current host without overwriting custom launchers.
`;
}
export function launcher():string {
 const cli=path.resolve(__dirname,'../bin/step7project.cjs');
 return `@echo off\r\nrem Step7Project generated launcher\r\nsetlocal\r\nset "ELECTRON_RUN_AS_NODE=1"\r\n"${process.execPath}" "${cli}" %*\r\n`;
}
export function refreshLauncher(root:string):boolean {
 const file=path.join(root,'step7project.cmd');
 if(fs.existsSync(file)&&fs.lstatSync(file).isSymbolicLink())return false;
 const existing=fs.existsSync(file)?fs.readFileSync(file,'utf8'):undefined;
 const generated=/^@echo off\r?\n(?:rem Step7Project generated launcher\r?\n)?setlocal\r?\nset "ELECTRON_RUN_AS_NODE=1"\r?\n"[^"\r\n]+" "[^"\r\n]*[\\/]bin[\\/]step7project\.cjs" %\*\r?\n?$/i;
 if(existing!==undefined&&!generated.test(existing))return false;
 const next=launcher();if(existing===next)return false;
 atomic(inside(root,'step7project.cmd'),next);return true;
}
