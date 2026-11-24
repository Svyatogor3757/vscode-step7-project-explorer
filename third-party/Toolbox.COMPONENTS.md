# Toolbox: лицензии отдельных частей и нюансы

Проверка: **24.11.2026**. Версия используемого NuGet-пакета: **4.4.10**. Исходники закреплены Git-подмодулем [sources/Toolbox](sources/Toolbox) на commit **`f0b2c5a98fe3e1b71861cd47403aac02338efc99`**, указанном в метаданных этого пакета. Машиночитаемое происхождение: [Toolbox.SOURCE.json](Toolbox.SOURCE.json).

Ниже отдельно приведены **найденные обозначения лицензий** и **нюансы их применения**. Они не являются новым разрешением от авторов и не объединяют весь upstream под одну выбранную нами лицензию.

| Часть | Найденная лицензия / источник | Нюансы |
| --- | --- | --- |
| NuGet-поставка 4.4.10, net461 | **MIT**, [страница NuGet](https://www.nuget.org/packages/DotNetProjects.DotNetSiemensPLCToolBoxLibrary/4.4.10), [nuspec](Toolbox.package.nuspec), библиотечный [csproj](sources/Toolbox/LibNoDaveConnectionLibrary/DotNetSiemensPLCToolBoxLibrary.csproj) | Эта декларация противоречит сохранённым LGPL-текстам и grants отдельных авторов. Она не доказывает право распространять каждый заимствованный фрагмент только по MIT. |
| Репозиторий Toolbox в целом | **LGPL 2.1**, [исходный LICENSE](sources/Toolbox/LICENSE), [копия](Toolbox.LICENSE.txt) | Базовое обозначение upstream. У отдельных файлов есть собственные notices, а у заимствованного DBF-кода обнаружена CPOL. Корневой LGPL-файл не отменяет эти условия. |
| MC7/AWL-конвертеры, ряд моделей блоков и communication-классов | **GNU Library GPL v2 или более поздняя** (`LGPL-2.0-or-later`), например [MC7Converter.cs](sources/Toolbox/LibNoDaveConnectionLibrary/PLCs/S7_xxx/MC7/MC7Converter.cs) | Сохраняются Jochen Kuehner и благодарности Steffen Krayer / Human, Zottel и другим авторам. Это grant заголовков конкретных файлов, а не доказательство той же лицензии для каждого файла без заголовка. Нужно соблюдать применимые условия LGPL по исходникам и замене/повторному связыванию. |
| Документация библиотеки | **LGPL 3**, [Documentation/Licence.txt](sources/Toolbox/LibNoDaveConnectionLibrary/Documentation/Licence.txt), [копия](Toolbox.LGPL-3.0.txt) | Ещё одно upstream-обозначение, отличающееся от корневого LGPL 2.1. Нельзя автоматически назначить LGPL 3 всему дереву только по этому файлу. При поставке по LGPL 3 требуется учитывать также включённые ею условия GPL 3. |
| Managed libnodave wrapper внутри Toolbox.dll | **GNU Library GPL v2 или более поздняя**, [libnodave.net.cs](sources/Toolbox/LibNoDaveConnectionLibrary/Communication/LibNoDave/libnodave.net.cs) | Copyright Thomas Hergenhahn, 2002–2005. Код находится в managed DLL даже при исключении native libnodave. Его notices сохраняются; авторство не передаётся Step7Project. |
| Оригинальный DBF-код Brian Duke | **CPOL 1.02**, [статья в архиве](https://web.archive.org/web/20220820015622id_/https://www.codeproject.com/Articles/24247/Load-a-DBF-into-a-DataTable), [связанная страница лицензии](https://web.archive.org/web/20220820015622id_/http://www.codeproject.com/info/cpol10.aspx), [полный текст](Toolbox.DBF.CPOL-1.02.txt) | Статья прямо относит приложенные исходники к CPOL; связанная license page называет версию 1.02. Автор — Brian Duke, copyright 2008. CPOL допускает коммерческие приложения, но содержит дополнительные ограничения, в том числе запрет сублицензирования и отдельные условия для публикации статьи. Это не MIT и не LGPL. Сочетание этих условий с LGPL и право на перелицензирование включённого фрагмента не подтверждены. |
| Изменённый DBF-парсер в Toolbox | Ссылка на оригинал в [ParseDBF.cs](sources/Toolbox/LibNoDaveConnectionLibrary/DBF/ParseDBF.cs); для upstream-проекта указан LGPL 2.1, оригинальный фрагмент имеет **CPOL 1.02** | Изменения upstream не доказывают исчезновение прав оригинального автора. Не обозначаем весь файл как чистый MIT/LGPL и не приписываем ему автоматически только CPOL: сохраняем оба источника и отмечаем необходимость обоснованного сочетания условий либо замены заимствованной реализации. |
| Native `libnodave_jfkmod*.dll` | Связанный libnodave использует Library GPL; конкретные native DLL **не включены в VSIX** | Полный upstream checkout содержит native-файлы и другие материалы для собственных задач. Этот аудит не объявляет все такие файлы разрешёнными к повторному распространению. |
| Остальные upstream-приложения, TIA-интеграции, externalDlls и примеры | Собственные notices и внешние условия в upstream | Подмодуль сохраняет оригинальное дерево для исследования. В нём могут быть Siemens-зависимости и другие компоненты; это не состав нашего VSIX. Подмодуль целиком исключён из упаковки. |

Остальные реально включённые библиотеки — SharpZipLib и System.* — перечислены отдельно с их MIT и вложенными notices в [../THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md). Их лицензии не изменились после добавления исходников Toolbox.

## Как получить исходники

```powershell
git submodule update --init --recursive
git -C third-party/sources/Toolbox rev-parse HEAD
# Ожидается f0b2c5a98fe3e1b71861cd47403aac02338efc99
git -C third-party/sources/Toolbox status --short
# Ожидается отсутствие локальных изменений
```

При новом клонировании можно сразу использовать `git clone --recurse-submodules <URL-этого-репозитория>`. Не выполняйте `submodule update --remote` ради обычной сборки: это другой commit, не соответствующий зафиксированной версии зависимости. GitHub ZIP исходного репозитория не содержит содержимое подмодуля; нужен Git checkout с его инициализацией.

Сейчас backend продолжает использовать **неизменённый NuGet 4.4.10**, а не автоматически подменённую сборку из checkout. Подмодуль — воспроизводимая исходная база для следующей работы: исследование, подготовка соответствующих исходников и проверка замены библиотеки. Добавление подмодуля само по себе не проверяет пересборку, ABI-совместимость и выполнение условий передачи DLL получателю.

Полная статья Brian Duke не перепубликуется. В репозитории сохранены только фактические сведения об авторе/лицензии, ссылки, контрольные суммы исследованных архивных HTML и полный текст самой лицензии. Действующая страница CodeProject при повторной проверке возвращала JS-переход на `/lander`; вывод о CPOL основан на архивном первоисточнике, а не на лицензии другого похожего DBF-проекта.
