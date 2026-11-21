# Bundled components

The extension code is MIT licensed. Redistributed assemblies retain their own licenses and notices in `third-party/`.

| Component | Version | Source/license |
| --- | --- | --- |
| DotNetProjects.DotNetSiemensPLCToolBoxLibrary | 4.4.10 | [Project](https://github.com/dotnetprojects/DotNetSiemensPLCToolBoxLibrary), `third-party/Toolbox.LICENSE.txt` |
| SharpZipLib | 1.4.2 | [Project](https://github.com/icsharpcode/SharpZipLib), MIT, `third-party/SharpZipLib.LICENSE.txt` |
| System.Buffers | 4.5.1 | Microsoft NuGet package; license and notices copied from the package |
| System.Memory | 4.5.4 | Microsoft NuGet package; license and notices copied from the package |
| System.Numerics.Vectors | 4.5.0 | Microsoft NuGet package; license and notices copied from the package |
| System.Runtime.CompilerServices.Unsafe | 4.5.3 | Microsoft NuGet package; license and notices copied from the package |
| System.Threading.Tasks.Extensions | 4.5.2 | Microsoft NuGet package; license and notices copied from the package |

`libnodave_jfkmod*.dll` are not needed by the offline browser and are excluded from the VSIX. Siemens binaries are not distributed; native import/compilation uses the user's STEP 7 installation.
