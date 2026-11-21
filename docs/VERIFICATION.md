# Проверки и ограничения

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
