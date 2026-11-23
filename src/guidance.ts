import path from 'node:path';
import fs from 'node:fs';
import {atomic,inside} from './storage';
export function agentGuide():string {
 return `# Работа с STEP 7 через Step7Project

Этот каталог — редактируемое представление нативного проекта STEP 7 Classic. Файлы в Programs доступны обычным инструментам чтения, поиска и редактирования. Сохранение текста не применяет изменения к STEP 7.

## Команды

Запускай из этого каталога на Windows-хосте проекта, в том числе в терминале VS Code Remote SSH:

\`\`\`powershell
.\\step7project.cmd doctor --json
.\\step7project.cmd status --workspace . --json
.\\step7project.cmd check --workspace . --json
.\\step7project.cmd apply --workspace . --json
\`\`\`

CLI всегда возвращает JSON. Код 0 означает успех; ненулевой код означает ошибку. check создаёт отдельный тестовый проект через STEP 7 и компилирует копии программ. apply повторяет проверку, затем изменяет нативный проект. Для записи нужен STEP 7 и проект, один раз открытый в SIMATIC Manager. При Remote SSH войди в Windows под той же учётной записью: компиляторы STEP 7 используют интерактивный сеанс.

Поле project в step7project.json может быть относительным: оно разрешается от папки манифеста. status.project и status.workspace возвращают полные пути. Для переносимости обеих папок вместе используй configure --workspace . --project-path relative; absolute сохраняет абсолютную привязку. Не подставляй текущий каталог терминала при разрешении project. После передачи представления открой его папку или JSON в расширении: служебный launcher обновится для текущего хоста, пользовательский скрипт сохранится.

## Порядок работы

1. Выполни status. Определи нужную программу по полному идентификатору: разные CPU могут иметь одинаковые имена файлов и номера блоков.
2. Читай и редактируй обычный файл, путь к которому пользователь скопировал из вкладки Step7Project. SCL редактируй в Sources; Blocks содержит отдельное представление скомпилированных блоков.
3. Сохраняй UTF-8. Для symbols сохраняй заголовок CSV symbol,address,type,comment, кавычки и все строки, которых задача не касается. У VAT тип данных может быть пустым. ASC — фиксированные поля, не произвольный CSV.
4. Выполни status и check. Исправь ошибки компилятора и конфликты. Не редактируй скомпилированное представление SCL вместо исходника.
5. Если задача включает запись в нативный проект, выполни apply. Иначе оставь локальные изменения и сообщи, что они ещё не применены.
6. Повтори status и прочитай результат. В отчёте различай изменение текста, успешную компиляцию на копии и успешное применение к нативному проекту. Проверка на ПЛК сюда не входит.

## Структурные изменения

\`\`\`powershell
.\\step7project.cmd create --workspace . --program "Station\\CPU\\Program" --type FC --number 901 --language scl
.\\step7project.cmd create --workspace . --program "Station\\CPU\\Program" --type DB --number 902 --language scl --instance-of "FB 20"
.\\step7project.cmd rename --workspace . --file "Programs/.../Sources/Name.scl" --name NewName
.\\step7project.cmd delete --workspace . --file "Programs/.../Blocks/FC/FC901.Name.awl"
\`\`\`

Точный --program возьми из status.programs, --file из status.changes. Создание создаёт исходник, компиляция создаёт блоки. Удаление исходника не удаляет его скомпилированные блоки. Для удаления блока используй его отдельный путь. Исчезновение файла с диска не считается разрешением удалить объект в STEP 7. Применяй изменения исходников и прямые правки блоков одной программы отдельными пакетами.

rename меняет имя объекта Sources (1–24 символа), а не имена функций внутри текста. Не переименовывай DB/FB/FC обычным перемещением файла: символьные имена задаются в Symbols, а смена номера требует отдельной миграции всех ссылок. Старое имя Symbols.symbols.csv допустимо. Чтобы перейти на Symbols.csv без локальных правок таблицы, закрой её редакторы и выполни symbols-format --workspace . --format csv; незнакомый целевой файл не перезаписывается.

## Ограничения и восстановление

- Не меняй нативные DBF/DBT/MDX, hardware, сети или подключение ПЛК.
- AWL использует мнемонику из status.awlMnemonics; она должна совпадать с Options > Customize > Language в STEP 7. Для смены без локальных правок: configure --workspace . --mnemonics english (или german), затем refresh --workspace .; Sources автоматически не переводится.
- Не обходи readOnly и know-how protection; используй доступный исходник. SFC/SFB и неподдерживаемые форматы доступны для чтения.
- Не редактируй step7project.json вручную ради снятия конфликтов. Не удаляй чужую блокировку записи.
- При recovery останови новые применения. Прочитай сообщение и снимок проекта, проверь фактическое состояние. restore восстанавливает только в новый путь. После осознанной проверки используй recover --acknowledge-native-state, затем status/refresh и снова check.
- Резервирование по умолчанию everySave. Внешние записи отслеживаются, пока расширение активно; при закрытом VS Code история каждого внешнего сохранения недоступна. Снимки проекта делаются перед apply во всех включённых режимах. off отключает постоянные копии.
- Не удаляй и не перезаписывай существующий AGENTS.md. При переносе рабочего каталога на другую машину исправь привязку CLI повторным подключением инструмента.
`;
}
export function launcher():string {
 const cli=path.resolve(__dirname,'../bin/step7project.cjs');
 return `@echo off\r\nrem Step7Project generated launcher\r\nsetlocal\r\nset "ELECTRON_RUN_AS_NODE=1"\r\n"${process.execPath}" "${cli}" %*\r\n`;
}
export function refreshLauncher(root:string):boolean {
 const file=path.join(root,'step7project.cmd');
 if(fs.existsSync(file)&&fs.lstatSync(file).isSymbolicLink())return false;
 const existing=fs.existsSync(file)?fs.readFileSync(file,'utf8'):undefined;
 const generated=/^@echo off\r?\n(?:rem Step7Project generated launcher\r?\n)?setlocal\r?\nset "ELECTRON_RUN_AS_NODE=1"\r?\n"[^"\r\n]+" "[^"\r\n]*[\\/]bin[\\/]step7project\.cjs" %\*\r?\n?$/i;
 if(existing!==undefined&&!generated.test(existing))return false;
 const next=launcher();if(existing===next)return false;
 atomic(inside(root,'step7project.cmd'),next);return true;
}
