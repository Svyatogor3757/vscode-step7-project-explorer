using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Threading;
using Microsoft.Win32.SafeHandles;

namespace Step7Project {
internal static class WindowMessages {
 // HWND belongs to Siemens; this handle borrows it and must never call DestroyWindow/CloseHandle.
 sealed class BorrowedWindow : SafeHandleZeroOrMinusOneIsInvalid {
  public BorrowedWindow(int value):base(false){SetHandle(new IntPtr(value));}
  protected override bool ReleaseHandle(){return true;}
 }
 [DllImport("user32.dll",EntryPoint="PostMessageW",ExactSpelling=true,CharSet=CharSet.Unicode,CallingConvention=CallingConvention.StdCall,SetLastError=true)]
 static extern int PostMessage(BorrowedWindow window,uint message,UIntPtr wParam,IntPtr lParam);
 [DllImport("user32.dll",ExactSpelling=true,CallingConvention=CallingConvention.StdCall)]
 static extern int IsWindow(BorrowedWindow window);
 [DllImport("user32.dll",ExactSpelling=true,CallingConvention=CallingConvention.StdCall)]
 static extern int GetDlgCtrlID(BorrowedWindow window);
 public static void ConfirmOverwrite(int dialogValue,int buttonValue) {
  using(var dialog=new BorrowedWindow(dialogValue))using(var button=new BorrowedWindow(buttonValue)) {
   int id=GetDlgCtrlID(button);if(id<=0||id>65535)throw new Exception("Cannot identify the STEP 7 overwrite button");
   if(PostMessage(dialog,0x0111,new UIntPtr((uint)id),new IntPtr(buttonValue))==0)throw new Win32Exception(Marshal.GetLastWin32Error());
  }
 }
 public static void CloseCreatedDocument(int value) {
  using(var window=new BorrowedWindow(value)) {
   if(window.IsInvalid||IsWindow(window)==0)return;
   if(PostMessage(window,0x0010,UIntPtr.Zero,IntPtr.Zero)==0)throw new Win32Exception(Marshal.GetLastWin32Error(),"Cannot close compiler-created STEP 7 document");
   for(int n=0;n<50;n++){if(IsWindow(window)==0)return;Thread.Sleep(100);}
   throw new Exception("STEP 7 is waiting for the compiler-created document to close. Check its window.");
  }
 }
}
}
