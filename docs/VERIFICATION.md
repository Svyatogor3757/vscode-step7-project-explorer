# Проверки и ограничения

## Редактура первого экрана после тега 0.1.5 – 2026-11-25

По дополнительным замечаниям пользователя после отправки тега 0.1.5 вступления README сокращены до четырёх абзацев примерно по 130 слов, русский текст служит основой английского. Убраны повторные описания работы с кодом, проверки и штатных Siemens-программ, шаблонные связки «для этого»/«вторая задача». Сохранены явное определение плагина VS Code, назначение представления оригинала, ИИ-ревью/создание кода, read-only ограничения, Windows/V5.5 SP3/S7-300 и Remote SSH. Применён навык ochelovechivanie, сверены правила и каталог повторов/шаблонов.

Добавлен media/overview.png: настоящий снимок расширения в отдельном временном профиле VS Code с синтетическим демонстрационным проектом. Дерево раскрыто до Sources/Symbols/Blocks и файлов; открыт SCL-редактор. Рабочий стол, пользовательские проекты, реальные PLC и Siemens-процессы не использовались; снимок получен из renderer через локальный DevTools, не нарисован. Служебные скрипты, профиль и фикстуры находятся вне распространяемых файлов.

GitHub About обновлён и повторно прочитан через API: короткое английское Description, Website на #quick-start, 18 Topics; имя репозитория и URL сохранены. README получили значки версии, MIT именно нашего кода, VS Code/Windows и быстрые ссылки; отдельная заметная ссылка Repository не добавлялась. Вторая языковая версия использует тот же снимок и тот же набор сведений. Эти правки сделаны после уже отправленного тега; v0.1.5 остаётся черновиком, тег и его assets не заменялись.

Проверено: русский вводный текст – **127 слов / 4 абзаца**, английский – **132 слова / 4 абзаца**; U+2014 отсутствует. Снимок – PNG **1280×840**, источники/Symbols/Blocks раскрыты до файлов. Ссылки и переключатели проверены для 11 документов; локальная упаковка с изображением прошла, verify-package подтвердил inventory/legal-файлы и backend doctor, отдельная проверка метаданных/NLS/типографики также прошла. CI и Draft VSIX release исходного тега `6c317a8` завершились success. Для включения поздних README/screenshot-правок в тот же тег запрошено явное согласование исключения из правила неизменяемости опубликованных тегов.

Пользователь явно согласовал обновление: «закомить все и запушь) добавь обнови тег и версию 0.1.5, мы ее ещё не публиканули». Поздние изменения перенесены из Unreleased в 0.1.5 обоих CHANGELOG. Это разовое разрешение обновить v0.1.5 и его неопубликованный черновик; версии 0.1.0–0.1.4 не затрагиваются. Исходный объект тега – `bdf0adbfc430e04189094de4be80da19475d885a`, исходный commit – `6c317a845f70d24d42c96a81f8d994e0bd61960a`. Для отправки тега используется адресный force-with-lease на этот объект, а не общий force. Перед заменой проверяется draft-состояние и сохраняются его метаданные и исходные assets.

Дополнительно пользователь указал существующий media/step7.svg как иконку карточки расширения. Геометрия SVG сохранена; через изолированный Chromium canvas подготовлен media/step7.png **256×256**, светлый контур на тёмном фоне. Package icon указывает на PNG, sidebar по-прежнему использует исходный SVG. PNG визуально проверен; проверка manifest/NLS дополнена ссылками и размерами иконки. Нативные зависимости и их лицензии не менялись.

После добавления иконки `npm test` повторно прошёл **93/93**, exit 0; локальная упаковка и verify-package также прошли. Резервная копия старого draft **456923270** сохранена локально вместе с release/tag JSON и двумя assets, SHA-256 проверены. Endpoint release-by-tag для этого черновика вернул 404; использован доступный владельцу список релизов, draft-состояние подтверждено. Копия старого VSIX: SHA-256 `0e3f21d83d2121a27faa5b7b1a841649b5be18836935faa8671a248692fb5de4`.

## Версия 0.1.5, имя и метаданные – 2026-11-25

Пользователь поручил включить текущие правки в 0.1.5, собрать VSIX, создать тег и GitHub Release, выполнить commit/push. Версия синхронизирована в package.json и двух полях lockfile. Весь новый текст README согласован с русским вариантом, важные возможности VS Code/ИИ выделены жирным, добавлено короткое упоминание Remote SSH; U+2014 в README отсутствует. Отображаемое имя Step7ProjectExplorer сохранено одинаковым в English/Russian. Исходные технические ID расширения/команд/CLI не менялись.

Категория уточнена до Programming Languages, добавлены 19 ключевых слов Siemens/STEP 7/SCL/AWL/STL/PLC/project explorer/AI. Ссылки repository, homepage, issues и MIT сохранены в метаданных. По [официальным исходникам VS Code](https://github.com/microsoft/vscode/blob/main/src/vs/workbench/contrib/extensions/browser/extensionsWorkbenchService.ts) getters repository/licenseUrl/supportUrl используют gallery, а не локальный manifest: правую колонку «Ресурсы» для VSIX нельзя заполнить только package.json. Пользователь отложил добавление заметной строки ссылок в README; она не включена. Marketplace-публикация не выполняется.

`npm test` – **93/93**, exit 0. Обновлённый `localization_covers_manifest_and_runtime_strings_with_matching_parameters` проверяет имя в обоих языках, displayName/settings title, GitHub metadata, MIT, категорию и поисковые ключевые слова. Проверка ссылок и языковых переключателей проходит для 11 документов. Технический инвентарь обновлён только по packageLockSha256; зависимости и legal-файлы не менялись, три открытых finding сохранены. Нативные STEP 7/PLC-проверки к этому изменению не относятся. Опубликованные версии 0.1.0–0.1.4 не перезаписываются.

Локальный `npm run package` успешно создаёт VSIX 0.1.5. Проверка архива `verify-package.ps1 -SkipExample` – PASS manifest/legal inventory и packaged backend doctor; пользовательский пример явно пропущен. Дополнительно проверены имя Step7ProjectExplorer, оба NLS, категория/19 keywords, GitHub metadata, license asset и типографика README внутри VSIX. Отдельный `licenses:check` ожидаемо возвращает exit 1 из-за прежних открытых findings; это отдельная проверка распространения, она не блокирует разрешённую пользователем упаковку и публикацию. После последнего уточнения первая строка обоих README явно определяет программу как плагин/extension VS Code; перед тегированием архив пересобирается с этими окончательными текстами.

Формулировка вводного абзаца уточнена по замечанию пользователя: плагин дополняет штатные Siemens-инструменты удобной работой с кодом в VS Code; оборудование, сети и остальные настройки остаются в штатных программах. Обещание замены штатных редакторов удалено в обоих языках.

## Назначение представления в README – 2026-11-25

В начале README.md и README.ru.md объяснены обе цели: редактирование STEP 7 кода и ссылок между объектами средствами VS Code, а также изучение, ревью, создание и доработка кода через ИИ-агентов. Русский текст принят за основу английского; ключевые возможности VS Code и ИИ выделены жирным, кратко упомянут Remote SSH на Windows-хост. Описана роль отдельной UTF-8 папки представления, сохранены Check/Apply, ограничения записи и необходимость STEP 7 consistency checks для зависимостей. Автоматический глобальный рефакторинг не обещается. Синхронизированы оба CHANGELOG; в быстром старте добавлена ссылка на опубликованные GitHub Releases вместо устаревшего упоминания черновиков. Все U+2014 в обоих README заменены на U+2013. Проверены относительные ссылки, языковые переключатели и отсутствие длинных тире.

Новое отображаемое название Step7ProjectExplorer применено к README, package displayName/settings title, английскому и русскому заголовку проводника, output/error сообщениям и новым генерируемым AGENTS.md. Технические идентификаторы команд, настройки, имя пакета/CLI и маркер совместимости существующих launcher-файлов сохранены; опубликованные теги и VSIX не перезаписываются. Проверки локализации и Extension Host обновлены под новое отображаемое имя.

`npm test` – **93/93**, exit 0; `localization_covers_manifest_and_runtime_strings_with_matching_parameters` проверяет displayName, settings title и название в обоих языках. `node tools/test-vscode.cjs` и вариант `--ru` – **18/18** каждый, exit 0; проверен заголовок контейнера в реальном Extension Host. Проверка относительных ссылок – **11 документов**, отсутствие U+2014 и прежнего названия подтверждено в обоих README. Пользователь отдельно поручил commit/push этих изменений. Версия пакета остаётся 0.1.4 с записью изменений в Unreleased; опубликованные сборки не пересобирались.

## Публичные GitHub Releases 0.1.0–0.1.4 — 2026-11-24

После подготовки пользователем push он отдельно явно поручил опубликовать все пять версий. Это разрешение заменяет прежнее ограничение этой задачи на draft-only публикацию; Git push в этой операции не выполнялся. Успешные hosted workflows на `2a3bb34`: [CI](https://github.com/Svyatogor3757/vscode-step7-project-explorer/actions/runs/45402637093) и [Draft VSIX release](https://github.com/Svyatogor3757/vscode-step7-project-explorer/actions/runs/45402636845). Технический `licenses:audit` прошёл с сохранением трёх открытых finding.

Перед публикацией через GitHub API скачаны реальные VSIX и SHA256SUMS всех пяти черновиков. Проверены digest/размер, version/name, соответствие тегов исходным коммитам и все **9 dependency DLL** в каждом архиве по текущему инвентарю. Исторические VSIX совпали с RELEASE-ARCHIVE.json; бинарники и теги не заменялись. Для 0.1.4 использован артефакт hosted CI: SHA-256 `e898e195a1ac0544efd520c6fa4e5a4abd4a581ac4d358c9a40cdb1786024612`, 770812 байт; его ZIP-хеш отличается от локальной сборки, поэтому сохранена соответствующая CI-контрольная сумма.

К каждой версии добавлен THIRD-PARTY-LICENSES.zip с **29** сохранёнными текстами лицензий, атрибуцией и актуальными review-документами. Это сопроводительные уведомления, не полный исходник Toolbox и не подтверждение закрытия review. В описаниях релизов сохранены лицензионные нюансы, ссылки на исходники и независимость от Siemens; устаревшая внутренняя инструкция «не публиковать draft» заменена описанием фактического состояния.

Опубликованы [v0.1.0](https://github.com/Svyatogor3757/vscode-step7-project-explorer/releases/tag/v0.1.0), [v0.1.1](https://github.com/Svyatogor3757/vscode-step7-project-explorer/releases/tag/v0.1.1), [v0.1.2](https://github.com/Svyatogor3757/vscode-step7-project-explorer/releases/tag/v0.1.2), [v0.1.3](https://github.com/Svyatogor3757/vscode-step7-project-explorer/releases/tag/v0.1.3), [v0.1.4](https://github.com/Svyatogor3757/vscode-step7-project-explorer/releases/tag/v0.1.4). Latest — **v0.1.4**. Анонимная проверка подтвердила публичный список, Latest и доступность всех **15** ссылок скачивания (VSIX, SHA256SUMS.txt, THIRD-PARTY-LICENSES.zip). Во время публикации Git push не выполнялся; опубликованные теги и исходники не изменялись.

## Локальная упаковка 0.1.4 и подготовка ручного push — 2026-11-24

Пользователь явно уточнил: локальная упаковка разрешена, наш проект сохраняет MIT, сторонние компоненты — собственные лицензии; Git push он выполняет сам. Соответственно обновлены AGENTS.md, README/CHANGELOG обоих языков и инструкция выпуска. Штатный prepublish собирает backend и TypeScript, затем выполняет технический `licenses:audit`. Tag workflow также выполняет аудит и готовит только черновик. Строгий `licenses:check` остаётся отдельной проверкой распространения; legal-файлы и три открытых finding не изменены. В инвентаре изменён только packageLockSha256 после смены версии.

`npm run package` создал локальный VSIX 0.1.4. Первая проверка реального архива выявила ошибку проверяющего скрипта: VSCE переименовывает LICENSE в LICENSE.txt. Добавлена поддержка стандартного имени со сверкой SHA-256 исходного текста. Узкий набор `node --test test/package-verification.test.cjs` — **8/8**, exit 0. Новые тесты: `packaged_archive_accepts_vsce_license_filename`, `packaged_archive_rejects_modified_vsce_license`, `packaged_archive_rejects_missing_root_license`. Они проверяют успешный архив, изменение содержимого и отсутствие лицензии; исходные проверки DLL, версии и обязательных документов сохранены. После обновления CHANGELOG проверка более раннего архива корректно выявила расхождение документации; итоговый архив пересобирается из окончательных файлов.

Финальный `npm test` — **93/93**, exit 0. YAML tag workflow разобран, сверены audit-команда, draft-only создание и версия 0.1.4 во всех трёх полях package/lock. STEP 7/PLC в этом изменении не запускались. Проверка итогового архива `tools/verify-package.ps1 -Package releases/step7project-0.1.4.vsix -SkipExample` прошла, exit 0: manifest/legal inventory и упакованный backend doctor подтверждены, архитектура x86, платформа Windows. SkipExample пропускает только пользовательский пример, остальные проверки остаются обязательными. Контрольная сумма сохраняется рядом с VSIX в игнорируемом releases/SHA256SUMS.txt. Git push, удалённые теги и публикация в этой задаче не выполняются.

## Подготовка локальной версии 0.1.4 — 2026-11-24

По запросу пользователя package.json и обе version-записи package-lock.json изменены на 0.1.4; изменения после 0.1.3 выделены в обоих CHANGELOG. README синхронизированы. TypeScript и backend успешно пересобраны; `npm test` — **90/90**, exit 0. После смены версии первый технический аудит выявил устаревший packageLockSha256. Инвентарь обновлён: diff затрагивает только этот хеш, зависимости и исходные legal-файлы не изменены. Повторный `licenses:audit` прошёл; три открытых finding сохранены.

Создание локального VSIX через прямой VSCE pack отклонено автоматической проверкой разрешений до запуска: этот вызов обходит prepublish/licensing gate и противоречит AGENTS.md при открытых Toolbox findings. Архив 0.1.4 не создан. Существующие VSIX, теги, GitHub Releases, проверки выпуска и findings не менялись. Повторный обход отклонённого действия не предпринимался; требуется явное согласование исключения.

## README, имя проводника и исправление hosted CI — 2026-11-24 (Unreleased)

Оба README теперь начинаются с описания отдельного редактируемого представления оригинального проекта, области Sources/Symbols/Blocks и ограничений записи. Быстрый старт указывает два последовательных выбора: исходный `.s7p`, затем родительскую папку для автоматически создаваемого `<project-name>-code`. Добавлен обзор функций; подробные разделы сохранены. Название `Step 7 Project Explorer` одинаково в English и Russian. Относительные ссылки и переключатели обоих языков прошли проверку.

Первый [GitHub CI на 2271fc7](https://github.com/Svyatogor3757/vscode-step7-project-explorer/actions/runs/45382481830) собрал backend, но завершился ошибкой тестов: Windows PowerShell наследовал через Node `PSModulePath` от PowerShell 7, из-за чего не загружался `Get-FileHash`; x86-проверка metadata также превысила timeout. Такое наследование описано в [Microsoft about_PSModulePath](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_psmodulepath?view=powershell-7.5). Исправление удаляет только эту переменную из окружения дочернего Windows PowerShell; прямой запуск backend сохраняет окружение. Таймауты не увеличены.

После исправления: `npm test` — **90/90**, exit 0; запуск backend/package/environment-тестов из PowerShell 7 через `-File` — **8/8**, exit 0. Тесты `legacy_powershell_environment_removes_module_paths_without_mutating_parent` и `bridge_sanitizes_only_legacy_powershell_children` проверяют регистр имени переменной, сохранность остальных значений, неизменность родителя и различие PowerShell/прямого EXE. Повторные English/Russian Extension Host проверки — **18/18** в каждом языке, включая английский заголовок контейнера. Нативные STEP 7 импорты и PLC в этой правке не выполнялись.

В origin отправлены полная история и теги `v0.1.0`–`v0.1.3` на исходных коммитах, перечисленных в [RELEASE-ARCHIVE.json](RELEASE-ARCHIVE.json). Созданы четыре черновика GitHub Releases: в каждом исходный VSIX и `SHA256SUMS.txt`; размеры и SHA-256 загруженных assets проверены по GitHub API. Публичная публикация бинарников и новая упаковка сохраняют блокировку до завершения лицензионного review согласно AGENTS.md.

Hosted [CI на cf018c3](https://github.com/Svyatogor3757/vscode-step7-project-explorer/actions/runs/45384892511) завершился **success**: `npm ci`, Windows backend build, `npm test`, `licenses:audit` и проверка генерируемой локализации прошли. Технический аудит проверил 7 runtime NuGet, 2 build-only NuGet и 298 npm-записей; три открытых лицензионных вопроса сохранены. Повторная API-проверка всех четырёх тегов и черновиков подтвердила исходные коммиты, draft-состояние, два assets на релиз, размеры и SHA-256 VSIX. Последние локальные Extension Host каталоги: English `SPB-vscode-QcRTrW`, Russian `SPB-vscode-cr9gxY`.

## Подготовка GitHub, документация и выбор языка — 2026-11-24 (Unreleased)

README и CHANGELOG теперь английские по умолчанию с русскими файлами и взаимными переключателями. AGENTS.md — один английский набор правил, включая сопровождение обеих версий, английские пользовательские документы и допустимые русские технические журналы. AGENT-USAGE.md, language/README.md и вновь генерируемый AGENTS.md экспортированного проекта — английские; русские руководства сохранены. Существующий пользовательский AGENTS.md по-прежнему не перезаписывается. Относительные ссылки и переключатели проверены для 11 основных документов.

Автоматический выбор интерфейса учитывает сохранённые пользовательские переводы, а не только встроенные. `languages_auto_detects_saved_language_and_preserves_explicit_choice` подтверждает German import → de-DE auto, fallback для fr-FR, приоритет явного English/Russian и отсутствие ошибки при отсутствующем пользовательском каталоге. `generated_agent_guide_is_english_and_preserves_native_write_workflow` проверяет английский заголовок, Check/Apply и ограничения нативной записи.

Итоговый `npm test`: **88/88**, exit 0. Пять `packaged_archive_*` проверяют положительный частный ZIP, отсутствие license-файла, подмену зависимости, чужую DLL и неверную версию. Это временные тестовые ZIP без VSIX-манифеста; новая установочная сборка не выпускалась и лицензионный gate не обходился. Первоначально фикстура не копировала THIRD-PARTY-NOTICES.md, что приводило к раннему отказу; фикстура дополнена, все позитивные и целевые негативные проверки прошли. Node CLI doctor внутри положительного архива подтверждает Windows/x86; user example export пропускается только явным флагом SkipExample. English Extension Host `SPB-vscode-nD4smm`: **18/18**; Russian `SPB-vscode-f6ymHI`: **18/18**. STEP 7/PLC не проверялись.

Архивы 0.1.0–0.1.3 сопоставлены с коммитами `614a89b`, `5c84596`, `7f0e340`, `134f040`. Проверены version/name/publisher; все 9/10/10/11 JavaScript-файлов в соответствующих VSIX побайтно совпали с TypeScript, заново скомпилированным из этих коммитов. SHA-256, полные коммиты и размеры сохранены в [RELEASE-ARCHIVE.json](RELEASE-ARCHIVE.json). Нативный backend не объявляется воспроизведённым побайтно. Исходная история и текущие файлы проверены на случайные ключи/токены без вывода значений: 177 уникальных blobs восьми исходных коммитов, находок нет.

Подготовлены CI и tag/manual release workflows с официальными Actions, закреплёнными полными SHA. CI собирает Windows/x86 и выполняет тесты/технический аудит; отдельный release workflow сохраняет лицензионный gate и создаёт только draft после успешной проверки. Теги подготовлены на исходных коммитах, архивные бинарники предназначены для черновиков. Фактические удалённые результаты фиксируются после отправки; это описание локальной проверки, не утверждение о завершённой публикации или прошедшем hosted CI.

## Исходники Toolbox и установленная CPOL — 2026-11-24 (Unreleased)

Добавлен подмодуль `third-party/sources/Toolbox` из официального upstream, закреплён на `f0b2c5a98fe3e1b71861cd47403aac02338efc99` из repository metadata NuGet 4.4.10. `git rev-parse HEAD` совпал; `git diff --quiet HEAD --` подтвердил отсутствие правок. Четыре сохранённых upstream-файла (LICENSE, README, библиотечный Licence.txt и csproj) побайтно совпали с `git show HEAD:<path>`. Вложенных Git-подмодулей у этого commit нет. Backend не переключался с NuGet на собственную сборку, поэтому проверка сборки/совместимости исходников не объявляется выполненной.

Повторный поиск впервые дал проверяемый архивный первоисточник DBF: снимок оригинальной статьи CodeProject **20220820015622**, Brian Duke, copyright 2008. Статья указывает CPOL для приложенного кода; связанная архивная license page содержит заголовок **CPOL 1.02**. Сохранён полный CPOL-текст из фиксированного commit SPDX, сверенный с найденной версией; URL и SHA-256 HTML/лицензии записаны в `third-party/Toolbox.SOURCE.json`. Сама статья не перепубликуется. Живая страница возвращает HTML с переходом на `/lander`; автоматическое web-извлечение архивного URL было недоступно, прямое разрешённое HTTP-чтение архивов успешно. Утверждение прежнего аудита «оригинальная лицензия не подтверждена» заменено в актуальных документах на **CPOL 1.02; сочетание с LGPL / право на перелицензирование не подтверждено**. Исторические записи выше/ниже отражают состояние на момент соответствующей проверки.

По каждой используемой группе кода указаны найденные MIT / LGPL 2.1 / Library GPL v2-or-later / LGPL 3 / CPOL 1.02 и их нюансы: [Toolbox.COMPONENTS.md](../third-party/Toolbox.COMPONENTS.md). Наличие подмодуля не объявляется выполненной corresponding-source поставкой для получателя VSIX; review остаётся открытым с обновлёнными причинами и сформулированными вопросами.

`node tools/licenses.cjs --write`, затем `node tools/licenses.cjs`: exit 0; 7 runtime NuGet, 2 build-only NuGet и 298 npm записей. `vsce ls --no-dependencies`: включены CPOL и описания происхождения/нюансов; исключены `.gitmodules` и **весь** `third-party/sources/`, включая чужие binaries и неиспользуемые upstream-приложения. Подмодуль находится в исходном Git-репозитории, не внутри VSIX. Новых runtime-зависимостей, backend-правок и UI-изменений нет; Node/GUI/native suite повторно не запускались. Команда `git submodule status` при обычном sandbox-запуске встретила ошибку Windows signal pipe; проверка pinned commit и Git-объектов выполнена разрешённым запуском Git через Node.

## Языки интерфейса и каталог сборок — 2026-11-24 (Unreleased)

Исходники переводов: `language/interface_en_us.json`, `language/interface_ru_ru.json`; `l10n/` удалён. Генератор находит `interface_*.json`, создаёт стандартные `package.nls*.json`, добавляет встроенные языки в schema настройки, дополняет неполные manifest-переводы английскими строками и удаляет только прежние сгенерированные файлы. Runtime использует тот же валидатор. Пользовательский импорт проверяет файл и копирует исходные байты в globalStorage расширения; подтверждение требуется только при замене отличающегося содержимого. Неизвестные строки и отсутствующие ключи используют английский fallback. Нативные пункты VS Code остаются на языке среды; открытый Symbols editor нужно переоткрыть.

| Требование | Проверка |
| --- | --- |
| Обнаружение языков и стандартные файлы VS Code | `languages_generate_settings_from_discovered_files`: временный неполный de_de добавляется в schema и package.nls.de.json; отсутствующая команда дополняется английской. `languages_remove_only_stale_generated_files_and_reject_unsafe_index` проверяет удаление языка и защиту выходных путей. |
| Переведённые подписи настроек | `languages_translate_setting_labels_without_changing_stored_values` проверяет все enumItemLabels и совместимость значений. `vscode_settings_show_translated_enum_labels_and_discovered_languages` проверяет реальные локализованные contributions в EN/RU Extension Host. |
| Выбор языка и неполные переводы | `languages_select_environment_region_override_and_english_fallback`, `languages_partial_translation_uses_standard_english_per_key`, `languages_runtime_custom_file_supports_partial_translation_and_invalid_file_fallback`. `vscode_language_override_and_partial_custom_translation_refresh_live` проверяет живой переход English → Russian → частичный пользовательский German → исходный язык. |
| Импорт без сборки | `languages_import_preserves_partial_file_bytes_and_discovers_saved_translation`, `languages_import_cancel_preserves_saved_file_and_confirm_replaces_it`, `languages_invalid_import_does_not_create_saved_translation`: фактическая запись в TEMP, обнаружение копии, сохранение BOM/CRLF, отмена и подтверждение замены, отсутствие записи после ошибки. Native file picker и клики пользователя по импорту автоматически не воспроизводились. |

`npm test`: **81/81**, exit 0. `node tools/test-vscode.cjs`: **18/18**, английский профиль, TEMP `SPB-vscode-4BBYXj`. `node tools/test-vscode.cjs --ru --upgrade`: **18/18**, русский профиль после seed 0.1.0 из `releases/`, TEMP `SPB-vscode-STRbj4`. Первое имя fixture `interface_RU_RU.json` на Windows совпало с существующим ru_ru; тест исправлен на отдельный DE_DE, отклонение неверного регистра подтверждено. Попытка обычного запуска Node runner встретила sandbox `spawn EPERM`; повторный разрешённый запуск прошёл. Проверка assertions/gaps: есть точные значения и side effects, успешные и отрицательные сценарии; временных мутаций кода не оставлено.

`npm run package` создаёт каталог `releases/` и передаёт его в `vsce --out`. Backend Release x86 и TypeScript успешно собираются; затем ожидаемый exit 1 на прежних открытых вопросах Toolbox. Новый VSIX не создан, старые пакеты не перезаписаны. `vsce ls --no-dependencies` включает новые language-файлы и dist/localization.js, не включает старый l10n, исходники, тесты, node_modules и архивы releases. Инвентарь лицензий по-прежнему проходит техническую сверку; разрешение на распространение Toolbox не объявляется полученным.

Изменений backend и native-операций в этой задаче нет; VM и ПЛК не использовались.

## Лицензионный аудит — 2026-11-24 (Unreleased)

Оформлена MIT для оригинального кода: Cody, https://github.com/Svyatogor3757. MIT проекта не распространяется на чужие компоненты и пользовательские PLC-проекты. Подробности и первичные источники: [LICENSING.md](LICENSING.md), [THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md).

Инвентарь: 7 runtime NuGet-пакетов (9 DLL, включая en/es resources Toolbox), 2 build-only NuGet-пакета и 298 npm lockfile-записей. Legal-файлы 286 установленных npm-пакетов сохранены; для четырёх пакетов без отдельного LICENSE сохранены README/package.json с обозначенной ограниченностью проверки. Восемь optional-пакетов других платформ не установлены, их содержимое не объявляется проверенным. В Git index нет подмодулей `160000`; пользовательские примеры не включены в аудит распространяемого кода.

У Toolbox 4.4.10 найдены противоречащие сведения MIT / LGPL 2.1 / LGPL 3 / Library GPL v2-or-later и ссылка на заимствованный DBF-код без проверенной оригинальной лицензии. Зафиксированы три открытых вопроса в `third-party/release-review.json`, включая подготовку corresponding-source и замену/пересборку при LGPL-поставке. 280 файлов библиотеки и два корневых файла upstream сверены с Git blob SHA-1 commit `f0b2c5a98fe3e1b71861cd47403aac02338efc99`; временная исследовательская копия не является распространяемым corresponding source. Два файла с BOM повторно получены как байты, без преобразования текста. System.* и TypeScript legal-файлы сверяются побайтно с восстановленными пакетами. `.gitattributes` сохраняет исходные байты legal-файлов, а не только отключает whitespace-проверки.

| Проверка | Результат |
| --- | --- |
| `npm test` | Успешно: 63/63 существующих Node-теста, TypeScript компилируется. Тестовые исходники не менялись. |
| `node tools/licenses.cjs` | Exit 0: версии, lockfile, legal-файлы и DLL соответствуют инвентарю; три открытых вопроса явно выведены. Это техническая сверка, не одобрение лицензии. |
| `node tools/licenses.cjs --release` | Ожидаемый exit 1: распространение блокируется открытыми вопросами Toolbox. |
| `npm run package` | Backend Release x86 успешно собран (0 ошибок / предупреждений), TypeScript скомпилирован; prepublish затем остановлен на `licenses:check`. Новый VSIX не создан. |
| `vsce ls --no-dependencies` | В будущем наборе файлов присутствуют LICENSE, AUTHORS.md, THIRD-PARTY-NOTICES.md, docs/LICENSING.md и runtime legal-файлы, включая TypeScript. `node_modules` и `third-party/development` исключены. |
| Чтение архива `step7project-0.1.3.vsix` | Все 9 DLL зависимостей побайтно совпали с восстановленными NuGet-файлами. Нет `node_modules`, примеров, Siemens DLL и native libnodave DLL. Старый архив не изменён и не признан подготовленным к распространению. |

Новые native-форматы записи не разрешались. VM, SIMATIC Manager и ПЛК в рамках этой задачи не запускались. Наличие license-файла в предыдущих package smoke-проверках подтверждало состав архива, а не выполнение всех LGPL-обязанностей. Открытые вопросы требуют подтверждённого основания и подготовки поставки либо замены зависимости; моки и успешная сборка не закрывают их.

## 0.1.3 — 2026-11-24

Переходы к нативному проекту и представлению объединены: открывается Explorer VS Code, переиспользуется ближайший содержащий корень либо добавляется нужная папка. Остальные папки workspace сохраняются. Отдельная команда контекстного меню продолжает открывать проводник Windows. Существующее закрытие проекта при удалении последней содержащей папки сохранено по уточнению пользователя; удержание проектов вне workspace не вошло в реализацию.

`npm test`: **63 passed, 0 failed, 0 skipped**. Настоящий Extension Host: **16 passed для English и 16 для Russian**; русский сценарий также использовал TEMP-профиль с панелью от 0.1.0. Отчёты: `%TEMP%\SPB-vscode-N8EZqK\projects\ui-test-results.json` и `%TEMP%\SPB-vscode-OqpS1m\projects\ui-test-results.json`. UI-тесты используют сохранённый `.code-workspace`, чтобы последовательные добавления/удаления корней не прерывали тестовый Extension Host переходом между режимами окна.

| Требование | Проверка |
| --- | --- |
| Обе ссылки переходят в Explorer и сохраняют существующие корни | `vscode_native_and_view_links_open_explorer_and_keep_existing_roots` |
| Ближайший корень, включая отдельную вложенную папку | `vscode_view_link_reuses_more_specific_workspace_root`, `navigation_reuses_parent_and_prefers_specific_second_workspace_root` |
| Удаление вложенного корня при открытом родителе не закрывает проект | `vscode_removing_specific_root_keeps_project_under_open_parent` |
| Удаление последнего содержащего корня закрывает проект; явное открытие подключает снова | `vscode_removed_view_folder_closes_connection_and_explicit_open_reconnects` |
| Новая папка добавляется до перехода, параллельные вызовы сериализуются | `navigation_appends_missing_folder_before_reveal_and_serializes_requests` |
| Нельзя принимать предварительный список папок за подтверждение | `navigation_waits_for_confirmed_workspace_event_not_tentative_folder_list` |
| Пустое окно / перезапуск хоста и смена режима одной папки | `navigation_empty_workspace_persists_reveal_and_resumes_after_host_restart`, `navigation_single_folder_transition_can_resume_without_restarting_host` |
| Закрытая или отменённая папка не восстанавливается автоматически | `navigation_does_not_reopen_folder_removed_or_cancelled_before_resume`, `navigation_cancelled_restart_can_be_retried_only_by_new_request` |
| Ошибки не открывают чужой корень и освобождают ожидания | `navigation_missing_location_or_invalid_parent_keeps_workspace_unchanged`, `navigation_rejected_folder_add_cleans_pending_and_listeners`, `navigation_timeout_does_not_reveal_wrong_workspace_and_cleans_pending`, `navigation_stale_pending_path_is_reported_and_not_reopened` |

В процессе проверки выявлена гонка: VS Code публикует предварительный список workspace folders до подтверждения изменения. Первый вариант helper завершал ожидание слишком рано; новый регрессионный тест падал на раннем reveal, после исправления прошёл. Адаптер использует подтверждённый список и событие изменения, а не только немедленное чтение workspaceFolders. Первичные основания: [extHostWorkspace](https://github.com/microsoft/vscode/blob/main/src/vs/workbench/api/common/extHostWorkspace.ts) и [переход между режимами workspace](https://github.com/microsoft/vscode/blob/main/src/vs/workbench/services/workspaces/browser/abstractWorkspaceEditingService.ts).

Пустое окно и переход из режима одной папки проверены через имитацию перезапуска и подтверждения workspace в unit-тестах, а не полным GUI-тестом остановки Extension Host. В GUI проверены реальные добавления/удаления корней сохранённого workspace. Незавершённый переход хранится только в пользовательском состоянии текущей сессии; при старте он не добавляет отсутствующий корень повторно. Файлы примеров и пользовательские представления не менялись. Backend и нативные форматы записи не изменялись, новые циклы записи STEP 7 на VM не запускались.

## 0.1.2 — 2026-11-23

Убрана постоянная инструкция над деревом; добавлена команда показа управления и явные локализованные заголовки групп. Пользователь подтвердил, что отсутствие новых групп после установки поверх старой версии устранилось перезапуском окна. Своего уведомления с перезапуском расширение не добавляет.

`vscode_controls_focus_reveals_group_without_project_banner` проверяет реальные TreeView в Extension Host: обе группы видимы после фокусировки, заголовки переведены, сообщение над деревом пусто. Это дополнение к прежней проверке только объявлений групп в package.json. Проверка English: 12 UI-сценариев passed. Проверка Russian: сначала отдельным запуском открыт старый VSIX 0.1.0, затем в том же TEMP-профиле/рабочей области запущена новая версия; 12 UI-сценариев passed. Оба процесса завершились с кодом 0. Это проверка сохранённого состояния после нового запуска окна, а не обещание корректного применения contributions без перезагрузки.

Воспроизведение: `npm run test:vscode`; `node tools/test-vscode.cjs --ru --upgrade`. Для второго сценария требуется оригинальный `step7project-0.1.0.vsix` (либо путь в `STEP7PROJECT_UPGRADE_VSIX`) и установленный Russian Language Pack. Тестовый профиль изолирован от пользовательского. В тесте пустое TreeView.message уточнено как пустая строка либо undefined по фактическому API. Регистрация языкового пакета восстанавливается между двумя тестовыми запусками, поскольку он не установлен в изолированный профиль. `npm test`: 52 passed, 0 failed/skipped; условие показа контекстных команд также проверено на реальные значения location.native/location.view.

Штатную кнопку перезапуска рядом с расширением определяет VS Code по состоянию установленной и запущенной версий. Поддерживаемого поля манифеста, требующего именно полного reload окна, нет; локальный restart extensions и reload window выбирает сама среда. Проверены [манифест](https://code.visualstudio.com/api/references/extension-manifest) и [реализация getRuntimeState](https://github.com/microsoft/vscode/blob/main/src/vs/workbench/contrib/extensions/browser/extensionsWorkbenchService.ts). Служебные поля или зависимости для имитации такого требования не добавлялись. C# backend и нативные форматы записи не менялись; новые испытания записи на VM не запускались.

## 0.1.1 — 2026-11-23

Обновление интерфейса и представлений. C# backend и разрешённые нативные форматы записи не менялись; нативные циклы от 2026-11-21 ниже относятся к версии 0.1.0 и повторно в этом обновлении не запускались. Пользовательские проекты и открытый S15-2026-code не изменялись.

Локально выполнены `npm test` и Extension Host на том же установленном VS Code с отдельными TEMP-профилями English и Russian. Для Russian изолированный профиль использует регистрацию уже установленного языкового пакета только для чтения; пользовательский профиль не изменяется. В первом русском запуске без языкового пакета VS Code выбрал English — это выявил тест. После подключения пакета русские подписи проверены настоящим `vscode.l10n`, а не подстановкой тестового словаря.

Результаты: **52 локальных теста passed, 0 failed, 0 skipped**; **11 UI-сценариев passed для English и 11 для Russian**, оба процесса завершились с кодом 0. Отчёты последнего запуска: `%TEMP%\SPB-vscode-HW9Q7T\projects\ui-test-results.json` (en) и `%TEMP%\SPB-vscode-2A65Lu\projects\ui-test-results.json` (ru). В тесте launcher сравнение путей уточнено с учётом нечувствительности Windows к регистру диска; фактическая ссылка проверяется на текущий runtime и текущую папку расширения.

`npm run package` собрал VSIX 0.1.1 без ошибок backend-сборки. `packaged_cli_offline_export` из `tools/verify-package.ps1` прошёл на содержимом VSIX: 2 программы / 112 объектов unchanged, schema 2 и относительная привязка разрешились в точный нативный путь. В пакете есть переводы, helper привязок и документация; пользовательские примеры и тестовые каталоги исключены. Установка в пользовательский профиль автоматически не выполнялась.

| Требование | Доказательство |
| --- | --- |
| Две отдельные стандартные группы, все пять действий и русский/английский интерфейс | `vscode_localized_controls_are_separate_and_all_actions_are_visible` в обоих языках; `localization_covers_manifest_and_runtime_strings_with_matching_parameters` проверяет полноту переводов и параметры |
| Автоматический поиск вложенных представлений без обхода backups | `vscode_discovers_nested_project_views_and_ignores_backups`: два вложенных представления найдены, третье в .step7project исключено |
| Активный проект, подсказки и ссылки | `vscode_active_project_controls_show_native_and_view_locations`: пути и переходы соответствуют активному проекту; смена файла переключает проект, ручной выбор переживает reload |
| Контекстное меню расположений | `vscode_project_location_context_menu_copies_correct_paths`: реальные команды записывают полный/относительный путь в clipboard, прежнее содержимое восстанавливается; проверены регистрации меню |
| Привязки представлений | `project_view_index_reconnects_only_matching_manifests_and_preserves_multiple_views`: проверяются текущий путь проекта, schema, дубликаты, повреждённые и отсутствующие JSON; неизвестные записи индекса сохраняются |
| Переносимость и диски | `relative_project_reference_survives_moving_native_project_and_view_together`, `project_view_index_resolves_relative_references_and_cross_drive_falls_back_to_absolute`: папки скопированы в другое место, native-путь правильно разрешён; разные диски дают абсолютный путь |
| Старые манифесты и локальные изменения | `project_path_configuration_preserves_legacy_absolute_paths_and_local_edits`: schema 1 / абсолютный путь сохраняются; явный переход на относительный включает schema 2 и не меняет локальные правки |
| Launcher на другой машине | `generated_launcher_rebinds_after_transfer_without_overwriting_custom_scripts`: распознанный старый launcher обновлён, пользовательский сохранён |
| Короткое имя Symbols и сохранность старых файлов | `symbols_new_exports_use_simple_filename_and_explicit_migration_keeps_legacy_edits`, `symbols_legacy_migration_refuses_existing_destination_without_overwrite` |
| Переименование Sources | `source_rename_validates_names_duplicates_and_keeps_block_declarations`: недопустимые имена и DB отклонены, длина 24 принята / 25 отклонена, дубликаты проверяются без регистра; код, номер блока и ссылки не меняются |

Для имён Sources использовано ограничение из [Siemens S7-SCL V5.3 for S7-300/400](https://cache.industry.siemens.com/dl/files/793/5581793/att_66783/v1/SCL_e.pdf): до 24 символов. Ограничения Windows дополнительно проверяются локально; возможность нативного импорта окончательно проверяет существующий staging.

Локализация использует `package.nls` и `vscode.l10n` по [официальному примеру VS Code](https://github.com/microsoft/vscode-extension-samples/tree/main/l10n-sample), группы — стандартный [Tree View API](https://code.visualstudio.com/api/extension-guides/tree-view). Тесты проверяют TreeDataProvider и команды внутри реального Extension Host, не визуальную раскладку каждого пикселя или все диалоги Windows Explorer. CLI и сообщения нативного компилятора остаются техническими диагностическими данными на исходном языке.

Воспроизведение обновлённых UI-проверок: `npm run test:vscode`, затем `node tools/test-vscode.cjs --ru`. Второй запуск требует установленного Russian Language Pack. Полные unit-проверки: `npm test`. Сборка и проверка пакета: `npm run package`, затем `powershell -NoProfile -ExecutionPolicy Bypass -File tools/verify-package.ps1`.

## 0.1.0 — 2026-11-21

Дата: **2026-11-21**. Это журнал выполненных проверок версии 0.1.0, а не заявление о проверке программы на ПЛК.

## Среда

- Локально: Windows, Node.js 26.13.0, .NET SDK 11.0.100, backend `net48` x86, VS Code 1.147.0.
- VM: `vmware-siemens`, Windows 10 build 19045, STEP 7 **V5.5 SP3**, строка установленного компонента `S7_S7BAS_K05.05.03.00`; SCL `K05.03.06.01_01.07.00.01`.
- SSH session 0; компиляция через временные задачи в существующем desktop-сеансе Admin. После перезагрузки доступ и запуск COM проверены повторно.
- Запись выполнялась только в новых TEMP-проектах. Пользовательский `S15-2026` использован для чтения: 2 программы, 112 объектов — 99 блоков, 11 исходников, 2 таблицы symbols. Пример не изменялся.

## Автоматические проверки локально

`npm run build:backend`: успешно, 0 предупреждений и ошибок. `npm test`: **43 passed, 0 failed, 0 skipped**. В число 43 входит один тест, запускающий 7 отдельных C#-проверок чтения метаданных symbols через x86 PowerShell.

| Требование | Точное имя теста / доказательство |
| --- | --- |
| CSV/ASC, кавычки, кириллица, VAT, пустая таблица | `symbols_round_trip_preserves_quotes_commas_and_cyrillic`, `symbols_vat_accepts_empty_type`, `symbols_empty_table_round_trip` |
| Ошибочные и неполные таблицы не теряют данные | `symbols_rejects_duplicate_name_and_field_overflow`, `csv_rejects_malformed_input_without_truncation`, `incomplete_native_symbols_are_readable_but_require_completion_before_apply` |
| Защита дополнительных атрибутов symbols | `backend_metadata_protects_advanced_and_unknown_attributes`: `metadata_plain`, `metadata_wincc_reference`, `metadata_unknown_field`, `metadata_zero_flag`, `metadata_deleted_row`, `metadata_empty_table`, `metadata_truncated_rejected` |
| Обычные файлы, безопасные пути и копии | `workspace_exports_real_files_and_rejects_existing_managed_folder`, `storage_rejects_escape_and_sanitizes_windows_names`, `project_copy_checks_content_and_excludes_lock_files`, `windows_case_variants_cannot_put_workspace_inside_native_project` |
| Конфликты и read-only | `refresh_preserves_local_changes_and_exposes_native_conflict`, `inventory_change_in_affected_program_is_a_conflict`, `read_only_object_cannot_be_modified_or_deleted`, `existing_lock_is_preserved_and_prevents_staging` |
| Создание, переименование, явное удаление | `create_cancel_and_duplicate_number_checks`, `templates_declare_expected_blocks_and_validate_instance`, `rename_source_is_pending_and_duplicate_name_is_rejected`, `missing_file_requires_explicit_deletion`, `compiled_scl_can_be_deleted_without_allowing_text_edits`, `symbols_object_is_kept_while_rows_can_be_cleared` |
| Проверка до записи, выбранные объекты | `dry_run_stages_without_mutating_native_or_clearing_edits`, `apply_verifies_generated_blocks_and_clears_pending_changes`, `selected_apply_keeps_other_pending_sources`, `mixing_source_and_direct_block_changes_is_rejected`, `stage_missing_compiled_target_prevents_native_write` |
| Ошибки и параллельные правки | `compile_failure_does_not_touch_native`, `partial_native_failure_leaves_durable_recovery_barrier`, `concurrent_edit_during_staging_prevents_native_write`, `concurrent_edit_during_apply_is_preserved_with_recovery`, `backup_disabled_recovery_points_to_restorable_project_root` |
| Все режимы резервирования и восстановление | `every_save_backup_captures_previous_external_version_and_restores`, `backup_interval_boundary_1m`, `backup_interval_boundary_10m`, `backup_interval_boundary_30m`, `backup_interval_boundary_1h`, `backups_off_does_not_create_persistent_copies`, `deletion_backup_restores_previous_file_contents` |
| CLI и инструкции для агентов | `cli_rejects_unknown_dry_run_flag_before_native_calls`, `invalid_manifest_backup_mode_is_rejected`, `existing_agents_guidance_is_preserved_on_export` |
| Формат symbols и изоляция мнемоники | `symbols_format_switch_preserves_data_and_rejects_dirty_table`, `awl_mnemonics_are_persisted_and_isolated_between_workspaces` |

Моки моделируют отказы и гонки в логике рабочего каталога; они не доказывают совместимость нативного импорта. Поэтому следующие проверки выполнялись отдельно на установленном STEP 7.

## Настоящий VS Code Extension Host

`npm run test:vscode`: **6 passed**, процесс завершился с кодом 0. Создан отдельный профиль Code и синтетический рабочий каталог, в путях есть пробелы и кириллица. Проверены:

- `vscode_opens_real_scl_document` — открытие физического SCL-файла.
- `vscode_save_creates_previous_version_backup` — сохранение и содержимое предыдущей версии.
- `vscode_opens_symbols_custom_editor` — запуск встроенного табличного редактора.
- `vscode_symbols_open_as_text_uses_same_file` — текстовый редактор работает с тем же CSV.
- `vscode_read_only_document_uses_content_provider` — неподдерживаемый блок открывается через read-only provider.
- `vscode_read_only_view_refreshes_after_export` — открытое read-only представление обновляется после экспорта.

Последний отчёт: `%TEMP%\SPB-vscode-yKOeba\code\ui-test-results.json`. Автоматизация проверяет редакторы через VS Code API; интерактивный ввод во все ячейки DOM таблицы отдельно не автоматизирован.

## Нативные циклы на VM

Основной сценарий `tools/vm-integration.cjs`: **9 passed**, код 0. Дополнительный `tools/vm-extra.cjs`: **5 passed**, код 0. Проект создан `tools/deploy-test.cjs` в `%TEMP%\Step7Project-2cb3b548ee0744d5a2917aabe66ec111`; отчёты `integration-results.json` и `extra-results.json` остаются там.

| Требование | Сценарий и проверенный результат |
| --- | --- |
| Чтение существующего проекта | `export_and_read_existing_fc`: FC901 экспортирован, локальных изменений нет |
| Добавление всех заявленных типов | `scl_create_fc_fb_ob_db_udt`: FC910, FB911, OB100, UDT912, DB913 созданы через SCL, скомпилированы и найдены при повторном экспорте |
| Экземплярный DB | `instance_db`: DB914 для FB911 создан и экспортирован |
| Редактирование SCL | `modify_scl_source`: изменено присваивание в FC910; apply включает сравнение stage и native-экспорта |
| Symbols: добавление, изменение, удаление | `symbols_create_edit_delete`: две строки импортированы, затем одна изменена и одна удалена; полная таблица сверена |
| Прямое редактирование блока AWL | `direct_awl_block_edit`: FC901 изменён с NOP на SET/CLR и перекомпилирован |
| Ошибка SCL не меняет оригинал | `compile_error_leaves_original_unchanged`: намеренно некорректный исходник отклонён; ID/хеши всех оригинальных объектов совпали до и после |
| Переименование | `rename_source`: исходник FC910 переименован в RenamedFC штатным импортом |
| Удаление | `delete_created_objects`: исходники и блоки явно удалены отдельными пакетами; повторный экспорт подтвердил отсутствие |
| Пустая таблица | `symbols_empty_table`: symbols полностью очищена без удаления объекта таблицы |
| Изменение структур | `db_udt_structure_edit`: в DB930 и UDT931 добавлено поле Extra:DINT через прямой AWL-экспорт |
| Недопустимый номер | `invalid_ob_is_rejected_without_native_change`: OB65535 отклонён на stage, оригинал не изменился |
| Кодировка | `unrepresentable_symbol_comment_preserves_native`: emoji в нативной CP1251 остановил импорт, оригинальные symbols сохранились |
| Очистка | `extra_created_objects_removed`: дополнительные тестовые объекты удалены |

После добавления выбора мнемоники выполнен отдельный свежий цикл `tools/vm-awl-logic.cjs`: **`awl_boolean_logic_round_trip` passed**, код 0. Создан FC940 с английской инструкцией `A M 100.0` и присваиванием `M 100.1`; изменён прямой экспорт на `M 100.2`; apply перекомпилировал блок, повторное чтение подтвердило операнд. Исходник и блок затем удалены. Каталог: `%TEMP%\Step7Project-56b4290ca2ce4e1cb4bf922901b272af`, отчёт `awl-logic-results.json`.

Этот последний сценарий использует финальный backend с явной English-мнемоникой. Основные 9 и дополнительные 5 сценариев выполнены до финального изменения выбора мнемоники; после него заново выполнены локальные 43 теста, UI 6 и нативный AWL-цикл. Немецкий экспорт поддержан, но компиляция с переключённым на German нативным STEP 7 отдельно не проверялась.

## Обнаруженные ошибки и исправления

- В session 0 компиляторы не работали надёжно: добавлен запуск в desktop-сеансе без пароля через Task Scheduler.
- SCL возвращал Count=0 при успешной компиляции: stage теперь требует заново созданные целевые блоки, поэтому старый блок не маскирует синтаксическую ошибку.
- Symbols.Import выполнял merge и возвращал количество строк: введена проверенная полная замена через временную программу; удаления и пустая таблица проверены нативно.
- Program.Copy пропускал открытый SCL-исходник: добавлены восстановление текста в одноразовом проекте и проверка полного инвентаря копии.
- Открытые документы и overwrite-диалоги мешали компиляции: закрываются только документы нашего запроса, открытый пользовательский исходник требует закрытия пользователем.
- Исходный German-экспорт не соответствовал English-компилятору: добавлен явный выбор языка; проверен цикл с реальными операндами AWL.
- Дополнительные поля symbols не помещаются в ASC: таблица переводится в read-only при обнаружении таких данных, вместо их потери.

## Границы проверки

Проверялись отдельные тестовые S7-программы; загрузки в ПЛК, поведения S7-300 на оборудовании, hardware, NetPro и safety не было. Большие реальные программы пользователя не перекомпилировались и не записывались.

Графические языки, защищённые и системные блоки не получили разрешения на запись. Поддержка произвольной структуры DB/UDT не означает проверку всех вариантов AT, вложений, атрибутов, сложных multi-instance и библиотечных типов. После структурных изменений требуется проверка согласованности зависимостей в STEP 7.

Работа GUI bridge проверена с установленными языковыми пакетами и английскими заголовками диалогов этой VM. Другие локализации и версии STEP 7 могут потребовать адаптации. При нативном сбое возможна частичная запись; recovery блокирует повторные применения, но не выполняет автоматический откат. Резервные копии восстанавливаются только в новый путь.

## Проверка устанавливаемого пакета

`npm run package` собрал VSIX; `tools/verify-package.ps1` распаковал его в отдельный scratch-каталог и запустил **включённые в пакет** CLI и backend. Проверка `packaged_cli_offline_export` прошла: 2 программы, 112 объектов, все в состоянии unchanged; созданы AGENTS.md, launcher и манифест. Проверены x86 backend, обязательные файлы, лицензия и отсутствие примеров, тестов, исходников, debug.log, sourcemaps и libnodave в пакете. Расширение не устанавливалось в пользовательский профиль автоматически.

## Воспроизведение

```powershell
npm ci
npm run build:backend
npm test
npm run test:vscode
node tools/deploy-test.cjs
node tools/run-integration.cjs
node tools/run-integration.cjs --extra
# Для отдельного чистого AWL-сценария:
node tools/deploy-test.cjs
node tools/run-integration.cjs --awl
npm run package
powershell -NoProfile -ExecutionPolicy Bypass -File tools/verify-package.ps1
```

VM-сценарии требуют разрешённого доступа к alias `vmware-siemens` и активного desktop-сеанса той же учётной записи. Каждый deploy создаёт новый TEMP-каталог, его путь записывается локально в `.scratch/remote-root.txt`. Не заменяйте `project.txt` ссылкой на рабочий проект.
