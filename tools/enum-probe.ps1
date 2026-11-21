$ErrorActionPreference='Stop';$ProgressPreference='SilentlyContinue'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.ComTypes;
using TYPEKIND=System.Runtime.InteropServices.ComTypes.TYPEKIND;
using TYPEATTR=System.Runtime.InteropServices.ComTypes.TYPEATTR;
using VARDESC=System.Runtime.InteropServices.ComTypes.VARDESC;
public static class TypeLibEnums {
 [DllImport("oleaut32.dll",CharSet=CharSet.Unicode,CallingConvention=CallingConvention.StdCall,ExactSpelling=true)]
 static extern int LoadTypeLibEx(string path,int kind,out ITypeLib library);
 public static void Read(string file) {
  ITypeLib library;Marshal.ThrowExceptionForHR(LoadTypeLibEx(file,2,out library));
  try {for(int n=0;n<library.GetTypeInfoCount();n++) {
   TYPEKIND kind;library.GetTypeInfoType(n,out kind);if(kind!=TYPEKIND.TKIND_ENUM)continue;
   string name,doc,help;int context;library.GetDocumentation(n,out name,out doc,out context,out help);
   ITypeInfo info;library.GetTypeInfo(n,out info);IntPtr attr;info.GetTypeAttr(out attr);
   try {var type=(TYPEATTR)Marshal.PtrToStructure(attr,typeof(TYPEATTR));for(int j=0;j<type.cVars;j++) {
    IntPtr ptr;info.GetVarDesc(j,out ptr);try {var variable=(VARDESC)Marshal.PtrToStructure(ptr,typeof(VARDESC));string[] names=new string[1];int found;info.GetNames(variable.memid,names,1,out found);Console.WriteLine(name+"."+names[0]+"="+Marshal.GetObjectForNativeVariant(variable.desc.lpvarValue));}finally{info.ReleaseVarDesc(ptr);}
   }}finally{info.ReleaseTypeAttr(attr);Marshal.ReleaseComObject(info);}
  }}finally{Marshal.ReleaseComObject(library);}
 }
}
'@
[TypeLibEnums]::Read('C:/Progra~2/Siemens/Step7/S7BIN/S7ABATCX.TLB')
[TypeLibEnums]::Read('C:/Progra~2/Siemens/Step7/S7BIN/S7HCOM_X.TLB')
