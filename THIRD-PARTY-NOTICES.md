# Third-party components and attribution

Original Step7Project code is Copyright (c) 2026 Cody ([Svyatogor3757](https://github.com/Svyatogor3757)), under [MIT](LICENSE). Third-party material retains its original rights and terms. The root MIT license does not relicense the components below. Complete original license and notice texts are in [third-party/](third-party/).

**Distribution review is open for Toolbox 4.4.10. Existing VSIX files are not cleared for redistribution by this audit.** See [the findings and required resolution](docs/LICENSING.md#toolbox) and [release-review.json](third-party/release-review.json). This notice is not a substitute for corresponding source or permission from upstream copyright holders.

## Managed dependencies included in the backend

| Component | Version | Attribution and license evidence |
| --- | --- | --- |
| DotNetProjects.DotNetSiemensPLCToolBoxLibrary | 4.4.10 | Jochen Kuehner / DotNetProjects and contributors. **Unresolved:** NuGet says MIT; upstream root [LGPL 2.1](third-party/Toolbox.LICENSE.txt), documentation [LGPL 3](third-party/Toolbox.LGPL-3.0.txt), [source headers](third-party/Toolbox.source-headers.txt) retain Library GPL v2-or-later grants. [Original credits](third-party/Toolbox.UPSTREAM-README.md), [NuGet metadata](third-party/Toolbox.package.nuspec). |
| SharpZipLib | 1.4.2 | ICSharpCode / SharpZipLib Contributors. [MIT](third-party/SharpZipLib.LICENSE.txt). The original license file credits 2000–2018; package metadata additionally credits 2000–2022. Both are retained. |
| System.Buffers | 4.5.1 | .NET Foundation and Contributors. [MIT](third-party/System.Buffers.LICENSE.TXT), [additional notices](third-party/System.Buffers.THIRD-PARTY-NOTICES.TXT). |
| System.Memory | 4.5.4 | .NET Foundation and Contributors. [MIT](third-party/System.Memory.LICENSE.TXT), [additional notices](third-party/System.Memory.THIRD-PARTY-NOTICES.TXT). |
| System.Numerics.Vectors | 4.5.0 | .NET Foundation and Contributors. [MIT](third-party/System.Numerics.Vectors.LICENSE.TXT), [additional notices](third-party/System.Numerics.Vectors.THIRD-PARTY-NOTICES.TXT). |
| System.Runtime.CompilerServices.Unsafe | 4.5.3 | .NET Foundation and Contributors. [MIT](third-party/System.Runtime.CompilerServices.Unsafe.LICENSE.TXT), [additional notices](third-party/System.Runtime.CompilerServices.Unsafe.THIRD-PARTY-NOTICES.TXT). |
| System.Threading.Tasks.Extensions | 4.5.2 | .NET Foundation and Contributors. [MIT](third-party/System.Threading.Tasks.Extensions.LICENSE.TXT), [additional notices](third-party/System.Threading.Tasks.Extensions.THIRD-PARTY-NOTICES.TXT). |

The .NET package notices also preserve acknowledgments and terms for embedded material (including Unicode, BSD, zlib, W3C and other material identified there). They have not been shortened to a single MIT label.

Toolbox `en` and `es` resource assemblies belong to the same Toolbox component. Its managed libnodave wrapper credits **Thomas Hergenhahn (2002–2005)** and contains a Library GPL v2-or-later notice even though the native `libnodave_jfkmod*.dll` binaries are excluded. Toolbox also credits **Steffen Krayer / Human**, **Thomas_V2**, **Brian Duke** (DBF parsing) and **SevenMag**; their upstream attribution is preserved. Excluding native DLLs does not remove the managed code's license obligations.

## Generated JavaScript

The extension is compiled with TypeScript **5.9.3**, Copyright Microsoft Corporation. The compiler is a development dependency and is not bundled. Its generated interop helpers may appear in emitted JavaScript; the [Apache 2.0 license](third-party/TypeScript.LICENSE.txt) and [original third-party notices](third-party/TypeScript.ThirdPartyNoticeText.txt) are included conservatively for these fragments. This does not change the MIT license of original Step7Project code.

## Build dependencies and external software

The [inventory](third-party/inventory.json) records every npm lockfile entry, the resolved NuGet packages, source commits where available, original legal-file hashes, and shipped dependency DLL hashes. There are no Git submodules in this repository at the audit date.

`node_modules`, the TypeScript compiler, `@types/*`, `@vscode/vsce` and its dependency tree, and .NET Framework reference-assembly packages are **not distributed in the VSIX**. Installed npm development dependency legal files are retained verbatim in [development/npm-notices.txt](third-party/development/npm-notices.txt) in the source repository; this development-only collection is excluded from VSIX. Uninstalled optional packages for other platforms are identified as metadata-only inspections, not as verified source licenses.

In particular, `@vscode/vsce-sign` and its platform packages have **Microsoft VSCE-SIGN terms**, not MIT. The installed terms restrict use to development/testing with the specified Visual Studio products/services and prohibit redistribution of the signing software. Do not redistribute `node_modules` as part of this product. Other development dependencies use the licenses recorded individually in the inventory, including attribution licenses such as CC-BY-3.0.

VS Code, Node/Electron, Windows, the installed .NET Framework and Siemens STEP 7 are external prerequisites with their own terms. No Siemens or native libnodave binaries, user PLC projects, or example projects are distributed. STEP 7 / SIMATIC / S7 names refer to Siemens products and do not imply Siemens authorship or endorsement. Users must obtain their own required Siemens licenses.

Audit date: **2026-11-24**. Maintenance and redistribution instructions: [docs/LICENSING.md](docs/LICENSING.md).
