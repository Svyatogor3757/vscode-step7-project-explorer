export type BackupMode='off'|'everySave'|'1m'|'10m'|'30m'|'1h';
export type Mnemonics='english'|'german';
export interface NativeItem { id:string; program:string; kind:'source'|'block'|'symbols'; name:string; nativeName:string; blockType:string; language:string; content:string; version:string; revision?:string; readOnly:boolean; canDelete?:boolean; reason?:string }
export interface ProgramInfo {id:string;name:string;path:string[]}
export interface Snapshot {name:string;encoding:number;programs:ProgramInfo[];items:NativeItem[]}
export interface Entry extends Omit<NativeItem,'content'> {file:string;baseHash:string;pending?:'create'|'delete';renamed?:string}
export interface Manifest {schema:1|2;project:string;projectPathMode?:'relative'|'absolute';projectName:string;encoding:number;programs:ProgramInfo[];entries:Entry[];symbolsFormat:'csv'|'asc';backupMode:BackupMode;backupDirectory?:string;awlMnemonics?:Mnemonics;recovery?:{directory:string;message:string}}
export interface Operation {program:string;kind:string;name:string;nativeName:string;content:string;action:'create'|'update'|'delete';blockType:string}
export interface Backend {withMnemonics?(mnemonics:Mnemonics):Backend;read(project:string):Promise<Snapshot>;execute(project:string,operations:Operation[]):Promise<void>;stage(project:string,operations:Operation[]):Promise<{snapshot:Snapshot;project:string}>;doctor():Promise<unknown>}
