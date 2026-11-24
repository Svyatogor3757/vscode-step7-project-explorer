# Third-party legal material

These files retain upstream licenses and attributions; the root MIT license does not replace them.

Toolbox source is pinned as the `sources/Toolbox` Git submodule at `f0b2c5a98fe3e1b71861cd47403aac02338efc99`. Initialize it with `git submodule update --init --recursive`. See [Toolbox.COMPONENTS.md](Toolbox.COMPONENTS.md) for the license and nuance of each part, [Toolbox.SOURCE.json](Toolbox.SOURCE.json) for provenance and archived primary sources, and [Toolbox.DBF.CPOL-1.02.txt](Toolbox.DBF.CPOL-1.02.txt) for the newly verified original DBF license. The backend still consumes the unmodified NuGet 4.4.10 package. The entire upstream checkout is excluded from VSIX.

- `*.LICENSE.*` and `*.THIRD-PARTY-NOTICES.*`: original license/notice files for shipped dependencies.
- `Toolbox.LGPL-3.0.txt`, `Toolbox.UPSTREAM-README.md`, `Toolbox.package.nuspec`, `Toolbox.csproj.txt`, `Toolbox.source-headers.txt`: additional evidence of the unresolved Toolbox license/provenance conflict. Header excerpts are **not** complete corresponding source.
- `TypeScript.*`: original Apache 2.0 license and notices, retained for emitted helper fragments.
- `inventory.json`: exact dependency versions, paths, integrity values and SHA-256 hashes; generated locally by `npm run licenses:inventory` after restoration and build. This command records facts and does not approve a new license.
- `release-review.json`: open release blockers. Resolve only after recording evidence and completing the applicable distribution requirements.
- `development/npm-notices.txt`: verbatim legal files from installed build dependencies, with generated separators. Source-repository documentation only, excluded from VSIX.

Sources, pinned commits, interpretation and release instructions: [../docs/LICENSING.md](../docs/LICENSING.md). Component mapping: [../THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md).
