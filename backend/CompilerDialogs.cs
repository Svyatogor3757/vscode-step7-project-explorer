using System;
using System.Threading;
using System.Text.RegularExpressions;
using System.Windows.Automation;

namespace Step7Project {
// STEP 7 sometimes displays a modal numeric error even in UnattendedServerMode.
// Only acknowledge errors below the editor containing this request's new document.
internal sealed class CompilerDialogs : IDisposable {
 readonly string caption;
 readonly Thread worker;
 readonly ManualResetEvent stop=new ManualResetEvent(false);
 volatile string error;
 public string Error {get{return error;}}
 public CompilerDialogs(string name,string program) {
  caption=name+" -- "+program;worker=new Thread(Watch){IsBackground=true};worker.SetApartmentState(ApartmentState.STA);worker.Start();
 }
 void Watch() {
  while(!stop.WaitOne(250)) {
   try {
    var doc=AutomationElement.RootElement.FindFirst(TreeScope.Descendants,new PropertyCondition(AutomationElement.NameProperty,caption,PropertyConditionFlags.IgnoreCase));
    if(doc==null)continue;
    AutomationElement parent=doc;
    for(int n=0;n<15&&parent!=null;n++,parent=TreeWalker.ControlViewWalker.GetParent(parent)) {
     string title=parent.Current.Name;
     if(!title.StartsWith("SCL",StringComparison.OrdinalIgnoreCase))continue;
     var windows=parent.FindAll(TreeScope.Descendants,new PropertyCondition(AutomationElement.ControlTypeProperty,ControlType.Window));
     foreach(AutomationElement dialog in windows) {
      string name=dialog.Current.Name;
      if(name=="Overwrite Blocks") {
       var all=dialog.FindFirst(TreeScope.Descendants,new PropertyCondition(AutomationElement.NameProperty,"All"));
       if(all!=null)WindowMessages.ConfirmOverwrite(dialog.Current.NativeWindowHandle,all.Current.NativeWindowHandle);
       continue;
      }
      if(!Regex.IsMatch(name,@"^\d+:\d+$"))continue;
      error="STEP 7 compiler error "+name+" in "+caption;
      WindowMessages.CloseCreatedDocument(dialog.Current.NativeWindowHandle);
     }
     break;
    }
   }catch(ElementNotAvailableException){}catch(System.Runtime.InteropServices.COMException){}catch(Exception ex){error="STEP 7 dialog handling failed: "+ex.Message;return;}
  }
 }
 public void Dispose(){stop.Set();if(worker.Join(1000))stop.Dispose();}
}
}
