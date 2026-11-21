using System;
using System.Threading;
using System.Windows.Automation;

namespace Step7Project {
// Borrowed HWNDs stay inside UI Automation. No window or application owned by the user is destroyed.
internal static class EditorWindows {
 static AutomationElement Document(dynamic source) {
  string caption=(string)source.Name+" -- "+(string)source.Program.LogPath;
  // AppWindowHandle raises E_FAIL when SCL has a document open on this installation.
  // Match the exact MDI caption (source + full project/program path) on our desktop instead.
  var windows=AutomationElement.RootElement.FindAll(TreeScope.Descendants,new PropertyCondition(AutomationElement.NameProperty,caption,PropertyConditionFlags.IgnoreCase));
  foreach(AutomationElement window in windows) {
   try {if(window.Current.ControlType==ControlType.Window&&string.Equals(window.Current.Name,caption,StringComparison.OrdinalIgnoreCase))return window;}catch(ElementNotAvailableException){}
  }
  return null;
 }
 public static void RequireClosed(dynamic source) {
  if(Document(source)!=null)throw new Exception("Close the STEP 7 editor document before importing changes: "+(string)source.LogPath);
 }
 public static void CloseCreated(dynamic source) {
  var document=Document(source);if(document==null)return;
  WindowMessages.CloseCreatedDocument(document.Current.NativeWindowHandle);
  for(int n=0;n<30;n++){try{if(Document(source)==null)return;}catch(ElementNotAvailableException){return;}Thread.Sleep(100);}
  throw new Exception("STEP 7 has not closed the compiler document: "+(string)source.LogPath);
 }
}
}
