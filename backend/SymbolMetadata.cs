using System;
using System.IO;
using System.Text;
using System.Linq;
using System.Collections.Generic;

namespace Step7Project {
// Read-only inspection. Native DBF/MDX files are never written by the bridge.
internal static class SymbolMetadata {
 static readonly HashSet<string> basic=new HashSet<string>(new[]{"_ID","_PARID","_CHANGED","_TIME","_STATE","_SKZ","_OPIEC","_OPHIST","_OPCODE","_OPTYPE","_OPBYTEO","_OPBITO","_DATATYP","_COMMENT"},StringComparer.OrdinalIgnoreCase);
 public static bool HasUnsupportedAttributes(string file) {
  byte[] bytes;
  using(var stream=new FileStream(file,FileMode.Open,FileAccess.Read,FileShare.ReadWrite|FileShare.Delete))using(var memory=new MemoryStream()){stream.CopyTo(memory);bytes=memory.ToArray();}
  if(bytes.Length<33)throw new InvalidDataException("Symbol metadata DBF is truncated");
  int header=BitConverter.ToUInt16(bytes,8),record=BitConverter.ToUInt16(bytes,10);uint count=BitConverter.ToUInt32(bytes,4);
  if(header<33||header>bytes.Length||record<1||(long)header+(long)record*count>bytes.Length)throw new InvalidDataException("Symbol metadata DBF has invalid bounds");
  int offset=1;var extra=new List<Tuple<int,int>>();
  for(int p=32;p<header&&bytes[p]!=13;p+=32) {
   if(p+32>header)throw new InvalidDataException("Invalid symbol DBF field descriptor");
   string name=Encoding.ASCII.GetString(bytes,p,11).TrimEnd('\0');int length=bytes[p+16];
   if(length<1||offset+length>record)throw new InvalidDataException("Invalid symbol DBF field length");
   if(!basic.Contains(name))extra.Add(Tuple.Create(offset,length));offset+=length;
  }
  if(offset!=record)throw new InvalidDataException("Unknown symbol DBF record layout");
  for(uint n=0;n<count;n++) {
   int start=checked(header+(int)((long)n*record));if(bytes[start]==42)continue;
   foreach(var field in extra)for(int p=0;p<field.Item2;p++){byte value=bytes[start+field.Item1+p];if(value!=0&&value!=32&&value!=48)return true;}
  }
  return false;
 }
}
}
