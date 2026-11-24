# Проверки и ограничения

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
