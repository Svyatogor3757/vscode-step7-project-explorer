using System;
using System.IO;
using System.Text;
using System.Linq;
using System.Collections;
using System.Collections.Generic;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Web.Script.Serialization;
using System.Text.RegularExpressions;
using DotNetSiemensPLCToolBoxLibrary.Projectfiles;
using DotNetSiemensPLCToolBoxLibrary.DataTypes.Projectfolders;
using DotNetSiemensPLCToolBoxLibrary.DataTypes;

namespace Step7Project {
public sealed class Item {
 public string id, program, kind, name, blockType, language, content, reason, nativeName, version, revision;
 public bool readOnly, canDelete;
}
public sealed class ProgramInfo { public string id, name; public string[] path; }
public sealed class Snapshot { public string name; public int encoding; public List<ProgramInfo> programs=new List<ProgramInfo>(); public List<Item> items=new List<Item>(); }
public sealed class Operation { public string program, kind, name, nativeName, content, action, blockType; }
public sealed class Request { public string command, project, mnemonics; public Operation[] operations; }
internal static class Bridge {
 static JavaScriptSerializer json=new JavaScriptSerializer {MaxJsonLength=int.MaxValue, RecursionLimit=200};
 static Encoding utf8=new UTF8Encoding(false,true);
 static MnemonicLanguage selectedMnemonics=MnemonicLanguage.English;
 static string Text(object o,string key) {return Convert.ToString(Get(o,key))??"";}
 static object Get(object o,string key) {return o.GetType().GetProperty(key)?.GetValue(o,null);}
 static IEnumerable<object> List(object o,string key) {return ((IEnumerable)Get(o,key))?.Cast<object>()??Enumerable.Empty<object>();}
 static string Hash(byte[] b) {using(var h=SHA256.Create())return BitConverter.ToString(h.ComputeHash(b)).Replace("-","").ToLowerInvariant();}
 static string[] FolderPath(object o) {var a=new List<string>();while(o!=null){a.Add(Text(o,"Name"));o=Get(o,"Parent");}a.Reverse();return a.Skip(1).ToArray();}
 static IEnumerable<object> Walk(object o) {yield return o;foreach(var c in List(o,"SubItems"))foreach(var v in Walk(c))yield return v;}
 static string Pad(string s,int width) {if(s.Length>width)throw new Exception("Symbol field exceeds ASC width: "+s);return s.PadRight(width);}
 public static Snapshot Read(string file) {
  using(var p=new Step7ProjectV5(Path.GetFullPath(file),false)) {
   // This changes the reader's output dialect, not Global/Language or STEP 7 settings.
   p.ProjectLanguage=selectedMnemonics;
   var r=new Snapshot {name=p.ProjectName,encoding=p.ProjectEncoding.CodePage};
   foreach(var f in Walk(p.ProjectStructure).Where(x=>x.GetType().Name=="S7ProgrammFolder")) {
    var path=FolderPath(f);var pid=string.Join("\\",path);r.programs.Add(new ProgramInfo {id=pid,name=Text(f,"Name"),path=path});
    foreach(var folder in List(f,"SubItems")) {
     var type=folder.GetType().Name;
     if(type=="SymbolTable") {
      var lines=List(folder,"SymbolTableEntrys").Select(s=>"126,"+Pad(Text(s,"Symbol"),24)+Pad(Text(s,"Operand"),12)+Pad(Text(s,"DataType"),10)+Pad(Text(s,"Comment"),80));
      var symbols=new Item {id=pid+"|symbols",program=pid,kind="symbols",name="Symbols",nativeName="Symbols",language="asc",content=string.Join("\r\n",lines)+"\r\n"};
      try {if(SymbolMetadata.HasUnsupportedAttributes(Path.Combine(Text(folder,"Folder"),"SYMLIST.DBF"))){symbols.readOnly=true;symbols.reason="Symbols contain advanced WinCC/PDIAG/communication or unknown attributes not represented by ASC/CSV. Edit this table in STEP 7 to preserve them.";}}
      catch(Exception ex){symbols.readOnly=true;symbols.reason="Cannot verify symbol metadata without data loss: "+ex.Message;}
      r.items.Add(symbols);
     } else if(type=="SourceFolder" || type=="BlocksOfflineFolder") {
      foreach(var info in List(folder,"BlockInfos")) {
       if(Get(info,"Deleted") is bool && (bool)Get(info,"Deleted"))continue;
       var b=new Item {program=pid,kind=type=="SourceFolder"?"source":"block",name=Text(info,"Name"),blockType=Text(info,"BlockType"),language=Text(info,"BlockLanguage")};
       b.nativeName=b.kind=="source"?b.name:Text(info,"BlockName");b.id=pid+"|"+b.kind+"|"+b.nativeName;
       try {
        if(b.kind=="source") {
         var filename=Text(info,"Filename");b.language=Path.GetExtension(filename).TrimStart('.').ToLowerInvariant();
         using(var stream=new FileStream(filename,FileMode.Open,FileAccess.Read,FileShare.ReadWrite|FileShare.Delete))
         using(var reader=new StreamReader(stream,p.ProjectEncoding,true))b.content=reader.ReadToEnd();
         b.readOnly=b.language!="scl"&&b.language!="awl"&&b.language!="stl";
         b.canDelete=!b.readOnly;
         if(b.readOnly)b.reason="This source language has no verified text import adapter.";
        } else {
         var raw=folder.GetType().GetMethod("GetBlockBytes").Invoke(folder,new[]{info});
         b.revision=Hash(utf8.GetBytes(json.Serialize(raw)));
         bool protect=Convert.ToBoolean(Get(info,"KnowHowProtection")??false);
         b.canDelete=!protect&&new[]{"OB","FC","FB","DB","UDT"}.Contains(b.blockType);
         b.readOnly=protect || !new[]{"OB","FC","FB","DB","UDT"}.Contains(b.blockType) || (b.language!="AWL"&&b.blockType!="DB"&&b.blockType!="UDT");
         if(protect){b.reason="Know-how protected block. Edit the original source if available.";b.content="// "+b.nativeName+": "+b.reason+"\r\n";}
         else {
          b.content=(string)folder.GetType().GetMethod("GetSourceBlock").Invoke(folder,new[]{info,(object)false});
          if(b.readOnly)b.reason="Edit original source; text round trip would lose the original block language or system implementation.";
         }
         if(string.IsNullOrWhiteSpace(b.content))throw new Exception("No complete source representation available.");
        }
       } catch(Exception ex) {b.readOnly=true;b.reason=(ex.InnerException??ex).Message;b.content="// "+b.nativeName+": "+b.reason+"\r\n";}
       r.items.Add(b);
      }
     }
    }
   }
   foreach(var i in r.items){i.version=Hash(utf8.GetBytes(i.content));if(i.revision==null)i.revision=i.version;}
   return r;
  }
 }
 static dynamic Com() {var t=Type.GetTypeFromProgID("Simatic.Simatic",true);dynamic s=Activator.CreateInstance(t);s.UnattendedServerMode=true;return s;}
 static dynamic Open(dynamic s,string file) {
  string dir=Path.GetFullPath(Path.GetDirectoryName(file)).TrimEnd('\\');
  dynamic projects=s.Projects;
  for(int n=1;n<=(int)projects.Count;n++) {dynamic p=projects.Item(n);if(string.Equals(((string)p.LogPath).TrimEnd('\\'),dir,StringComparison.OrdinalIgnoreCase))return p;}
  throw new Exception("Open this project once in SIMATIC Manager so Command Interface can access it: "+file);
 }
 static dynamic Program(dynamic project,string id) {
  dynamic programs=project.Programs;
  for(int n=1;n<=(int)programs.Count;n++){dynamic p=programs.Item(n);string log=(string)p.LogPath;int first=log.IndexOf('\\');if(first>=0&&log.Substring(first+1)==id)return p;}
  throw new Exception("Program not found: "+id);
 }
 static dynamic Container(dynamic p,int concrete) {dynamic children=p.Next;for(int n=1;n<=(int)children.Count;n++){dynamic c=children.Item(n);if((int)c.ConcreteType==concrete)return c;}throw new Exception("Required software container not found.");}
 static object Stage(Request req) {
  dynamic s=Com();dynamic original=Open(s,req.project);
  var originalSnapshot=Read(req.project);
  string root=Path.Combine(Path.GetTempPath(),"SPB-check-"+Guid.NewGuid().ToString("N"));Directory.CreateDirectory(root);
  dynamic stage=s.Projects.Add("SPB_"+Guid.NewGuid().ToString("N").Substring(0,8),root,1122305);
  var map=new Dictionary<string,string>();
  try {
   foreach(string pid in req.operations.Select(o=>o.program).Distinct()) {
    dynamic source=Program(original,pid);dynamic copied=source.Copy(stage);copied.Name="P"+map.Count;
    string log=(string)copied.LogPath;map[pid]=log.Substring(log.IndexOf('\\')+1);
   }
   s.Save();string file=Directory.GetFiles((string)stage.LogPath,"*.s7p").Single();
   // STEP 7 can skip a source that the SCL editor still holds open during Program.Copy.
   // Reconstruct its text in the disposable project; never modify the original source.
   var copiedSnapshot=Read(file);int sourceIndex=0;
   foreach(var sourceItem in originalSnapshot.items.Where(i=>i.kind=="source"&&map.ContainsKey(i.program))) {
    string stageProgram=map[sourceItem.program];
    var copiedItem=copiedSnapshot.items.FirstOrDefault(i=>i.program==stageProgram&&i.kind=="source"&&i.nativeName==sourceItem.nativeName);
    if(copiedItem!=null&&copiedItem.version==sourceItem.version)continue;
    if(sourceItem.readOnly)throw new Exception("Cannot stage unsupported source "+sourceItem.name+". Close its STEP 7 editor and retry.");
    dynamic sources=Container(Program(stage,stageProgram),1122308);
    if(copiedItem!=null)sources.Next.Item(sourceItem.nativeName).Remove();
    string sourceFile=Path.Combine(root,"original"+(sourceIndex++)+"."+sourceItem.language);
    var encoding=Encoding.GetEncoding(originalSnapshot.encoding,EncoderFallback.ExceptionFallback,DecoderFallback.ExceptionFallback);
    File.WriteAllText(sourceFile,sourceItem.content,encoding);sources.Next.Add(sourceItem.nativeName,65,sourceFile);
   }
   s.Save();copiedSnapshot=Read(file);
   foreach(var item in originalSnapshot.items.Where(i=>map.ContainsKey(i.program))) {
    var copied=copiedSnapshot.items.FirstOrDefault(i=>i.program==map[item.program]&&i.kind==item.kind&&i.nativeName==item.nativeName);
    if(copied==null||copied.version!=item.version)throw new Exception("STEP 7 did not copy "+item.nativeName+" completely. Close its editor and retry. Native project was not modified.");
   }
   var operations=req.operations.Select(o=>new Operation {program=map[o.program],kind=o.kind,name=o.name,nativeName=o.nativeName,blockType=o.blockType,content=o.content,action=o.action}).ToArray();
   ExecuteIn(new Request {project=file,operations=operations},s,stage,true);var snapshot=Read(file);
   foreach(var item in snapshot.items){string old=map.Single(x=>x.Value==item.program).Key;item.id=old+item.id.Substring(item.program.Length);item.program=old;}
   foreach(var p in snapshot.programs){p.id=map.Single(x=>x.Value==p.id).Key;p.path=p.id.Split('\\');}
   return new {snapshot=snapshot,project=file};
  } finally {Marshal.ReleaseComObject(stage);Marshal.ReleaseComObject(original);Marshal.ReleaseComObject(s);GC.Collect();GC.WaitForPendingFinalizers();}
 }
 static void Execute(Request req) {
  dynamic s=Com();dynamic project=Open(s,req.project);
  try {ExecuteIn(req,s,project);}
  finally {Marshal.ReleaseComObject(project);Marshal.ReleaseComObject(s);GC.Collect();GC.WaitForPendingFinalizers();}
 }
 static string[] Targets(Operation op,Snapshot snapshot) {
  var targets=new List<string>();
  var text=Regex.Replace(op.content,@"\(\*[\s\S]*?\*\)|/\*[\s\S]*?\*/|//[^\r\n]*","");
  foreach(Match match in Regex.Matches(text,"^\\s*(FUNCTION_BLOCK|FUNCTION|ORGANIZATION_BLOCK|DATA_BLOCK|TYPE)\\s+(\"[^\"]+\"|(?:FB|FC|OB|DB|UDT)\\s*\\d+|[\\p{L}_][\\p{L}\\p{N}_]*)",RegexOptions.Multiline|RegexOptions.IgnoreCase)) {
   string token=match.Groups[2].Value.Trim('"'),id=Regex.Replace(token,@"\s+","").ToUpperInvariant();
   if(!Regex.IsMatch(id,@"^(FB|FC|OB|DB|UDT)\d+$")) {
    var symbols=snapshot.items.FirstOrDefault(i=>i.program==op.program&&i.kind=="symbols");
    string line=symbols?.content.Split(new[]{"\r\n","\n"},StringSplitOptions.RemoveEmptyEntries).FirstOrDefault(l=>l.Length==130&&string.Equals(l.Substring(4,24).TrimEnd(),token,StringComparison.OrdinalIgnoreCase));
    if(line==null)throw new Exception("Cannot resolve block symbol '"+token+"'. Define it in Symbols or use a numeric block identifier.");
    id=Regex.Replace(line.Substring(28,12),@"\s+","").ToUpperInvariant();
   }
   targets.Add(id);
  }
  if(targets.Count==0)throw new Exception("No block declarations found in source "+op.name);
  if(targets.Any(id=>!Regex.IsMatch(id,@"^(FB|FC|OB|DB|UDT)\d+$")))throw new Exception("Only user OB/FC/FB/DB/UDT blocks can be compiled");
  return targets.Distinct().ToArray();
 }
 static string[] CanonicalSymbols(string asc) {
  return asc.Split(new[]{"\r\n","\n"},StringSplitOptions.RemoveEmptyEntries).Select(line=> {
   if(line.Length!=130)throw new Exception("Invalid canonical ASC record length");
   return line.Substring(4,24).TrimEnd()+"|"+Regex.Replace(line.Substring(28,12),@"\s+","")+"|"+Regex.Replace(line.Substring(40,10),@"\s+","")+"|"+line.Substring(50,80).TrimEnd();
  }).OrderBy(x=>x,StringComparer.Ordinal).ToArray();
 }
 static void ReplaceSymbols(dynamic project,dynamic program,Request req,string asc,Encoding encoding,string temp) {
  string programLog=(string)program.LogPath;string programId=programLog.Substring(programLog.IndexOf('\\')+1);
  var current=Read(req.project).items.Single(i=>i.program==programId&&i.kind=="symbols");
  if(current.readOnly)throw new Exception(current.reason);
  string path=Path.Combine(temp,"symbols.asc");File.WriteAllText(path,asc,encoding);
  // Import is a merge and returns the imported row count, not an error code.
  // Build a complete replacement in a temporary program in the same project/codepage.
  dynamic scratch=project.Programs.Add("SPB_Symbols_"+Guid.NewGuid().ToString("N").Substring(0,8),1327361);
  try {
   var expected=CanonicalSymbols(asc);
   dynamic table=scratch.SymbolTable;int count=expected.Length==0?0:(int)table.Import(path,0);
   string log=(string)scratch.LogPath;string pid=log.Substring(log.IndexOf('\\')+1);
   sSave(project);
   var imported=Read(req.project).items.Single(i=>i.program==pid&&i.kind=="symbols");
   if(count!=expected.Length||!CanonicalSymbols(imported.content).SequenceEqual(expected))throw new Exception("STEP 7 could not import the complete symbol table; native symbols remain unchanged.");
   dynamic old=program.SymbolTable;string name=old==null?"Symbols":(string)old.Name;string comment=old==null?"":(string)old.Comment;
   if(old!=null)old.Remove();
   dynamic replacement=table.Copy(program);replacement.Name=name;replacement.Comment=comment;
  } finally {scratch.Remove();}
 }
 static void sSave(dynamic project) {dynamic root=project.Parent;root.Save();}
 static void ExecuteIn(Request req,dynamic s,dynamic project,bool validateCompiler=false) {
  string temp=Path.Combine(Path.GetTempPath(),"SPB_"+Guid.NewGuid().ToString("N"));Directory.CreateDirectory(temp);
  var completed=new List<string>();
  try {
   int cp=Read(req.project).encoding;
   var encoding=Encoding.GetEncoding(cp,EncoderFallback.ExceptionFallback,DecoderFallback.ExceptionFallback);
   s.VerbLogFile=Path.Combine(temp,"step7.log");
   foreach(var op in req.operations??new Operation[0]) {
    if(op.kind!="source"&&op.kind!="block"&&op.kind!="symbols")throw new Exception("Unsupported object kind "+op.kind);
    dynamic p=Program(project,op.program);
    if(op.kind=="symbols") {
     ReplaceSymbols(project,p,req,op.content,encoding,temp);
    } else if(op.action=="delete") {
     dynamic c=Container(p,op.kind=="source"?1122308:1138689);dynamic target=c.Next.Item(op.nativeName);
     if(op.kind=="block"&&((bool)target.KnowHowProtection||!Regex.IsMatch(op.nativeName,@"^(OB|FC|FB|DB|UDT)\d+$")))throw new Exception("Cannot delete a protected or system block "+op.nativeName);
     if(op.kind=="source")EditorWindows.RequireClosed(target);
     target.Remove();
    } else {
     dynamic sources=Container(p,1122308);
     string[] targets=null;
     if(validateCompiler) {
      var before=Read(req.project);targets=Targets(op,before);dynamic blocksFolder=Container(p,1138689);
      foreach(string target in targets) {
       var existing=before.items.FirstOrDefault(i=>i.program==op.program&&i.kind=="block"&&i.nativeName==target);
       if(existing!=null){dynamic block=blocksFolder.Next.Item(target);if((bool)block.KnowHowProtection)throw new Exception("Cannot overwrite protected block "+target);block.Remove();}
      }
     }
     bool isSource=op.kind=="source";string ext=isSource&&op.blockType=="scl"?".scl":".awl";
     string name=isSource?op.name:"SPB_"+Guid.NewGuid().ToString("N").Substring(0,12);
     string path=Path.Combine(temp,"source"+ext);File.WriteAllText(path,op.content,encoding);
     if(isSource&&op.action!="create") {dynamic oldSource=sources.Next.Item(op.nativeName);EditorWindows.RequireClosed(oldSource);oldSource.Remove();}
     dynamic source=sources.Next.Add(name,65,path);
     EditorWindows.RequireClosed(source);
     try {
      using(var dialogs=new CompilerDialogs((string)source.Name,(string)p.LogPath)) {
       dynamic blocks=source.Compile();
       if(dialogs.Error!=null)throw new Exception(dialogs.Error);
       File.AppendAllText(Path.Combine(temp,"compile-results.txt"),name+" -> "+(int)blocks.Count+" blocks\r\n");
       if(ext==".awl"&&(int)blocks.Count==0)throw new Exception("AWL compiler produced no blocks. See "+s.VerbLogFile);
      }
     }
     finally {EditorWindows.CloseCreated(source);if(!isSource)source.Remove();}
     if(validateCompiler) {
      s.Save();var after=Read(req.project);
      foreach(string target in targets)if(!after.items.Any(i=>i.program==op.program&&i.kind=="block"&&i.nativeName==target))throw new Exception("Compiler did not generate "+target+" from "+op.name+". Review the STEP 7 compiler diagnostics. Native project was not modified.");
     }
    }
    completed.Add(op.program+"|"+op.kind+"|"+op.nativeName);
   }
   s.Save();
  } catch(Exception ex) {try{s.Save();}catch{}throw new Exception("Native operation failed; completed: "+string.Join(", ",completed)+". "+ex.Message+". Diagnostics retained at "+temp,ex);}
 }
 [STAThread] static int Main(string[] args) {
  Console.OutputEncoding=utf8;Console.InputEncoding=utf8;
  if(args.Length==2) {
   var output=new StringWriter();var error=new StringWriter();Console.SetOut(output);Console.SetError(error);
   int code=Run(File.ReadAllText(args[0],utf8));
   File.WriteAllText(args[1]+".tmp",json.Serialize(new {exitCode=code,stdout=output.ToString(),stderr=error.ToString()}),utf8);File.Move(args[1]+".tmp",args[1]);return code;
  }
  return Run(Console.In.ReadToEnd());
 }
 static int Run(string input) {
  try {
   var req=json.Deserialize<Request>(input);
   if(req.mnemonics!=null&&req.mnemonics!="english"&&req.mnemonics!="german")throw new Exception("Mnemonics must be english or german");
   selectedMnemonics=req.mnemonics=="german"?MnemonicLanguage.German:MnemonicLanguage.English;
   if(req.command=="read")Console.WriteLine(json.Serialize(Read(req.project)));
   else if(req.command=="doctor")Console.WriteLine(json.Serialize(new {windows=true,x86=!Environment.Is64BitProcess,comRegistered=Type.GetTypeFromProgID("Simatic.Simatic")!=null}));
   else if(req.command=="execute"){Execute(req);Console.WriteLine("{\"ok\":true}");}
   else if(req.command=="stage")Console.WriteLine(json.Serialize(Stage(req)));
   else throw new Exception("Unknown bridge command.");
   return 0;
  } catch(Exception ex) {Console.Error.WriteLine(json.Serialize(new {error=ex.Message,detail=ex.ToString()}));return 1;}
 }
}
}
