# Interface translations

**English** | [Русский](README.ru.md)

Editable bundled translations live here: `interface_en_us.json` is standard English; `interface_ru_ru.json` is Russian. Filenames use lowercase language/region codes. `name` is the display name and `vscodeLocale` identifies the editor locale. `messages` translates the tree, dialogs and Symbols editor; `manifest` translates native VS Code contributions.

## Personal translations without rebuilding

Create a file such as `interface_de_de.json`:

```json
{
  "name": "Deutsch",
  "vscodeLocale": "de",
  "messages": {
    "Project": "Projekt",
    "Open Project": "Projekt öffnen"
  }
}
```

Run **Choose Interface Language → Import translation file**. The extension validates it, saves an original-byte copy in its user storage on the extension host, and selects it. Saved translations appear in that command's language list. No source checkout, VSIX build or pull request is required. Replacing different contents asks for confirmation; cancellation preserves the existing file.

Translations can be partial: missing keys and missing sections use standard English. Preserve placeholders such as `{0}` and `{1}`. Invalid JSON, empty values and damaged placeholders are rejected. An unreadable configured file falls back to English and records the reason in Output → Step7Project.

`step7project.interface.language` defaults to automatic selection: a matching bundled or imported language follows VS Code's Display Language; an unsupported locale uses English. Explicit choices are preserved. `step7project.interface.customFile` points to a personal translation copy; it is a machine setting outside the PLC project. With Remote SSH, storage is on the extension host. Edit that file and select the language again, or import an updated original. User storage survives extension-installation directory changes.

The tree and subsequent dialogs change language immediately. Reopen an existing Symbols editor. Native command-palette labels, the activity container and settings follow **VS Code's own Display Language**; a personal translation does not change the editor shell. Native settings expose a “Custom translation from file” choice; the command lists individual imported files.

## Bundled translations for a release

Add `interface_<code>.json` and run:

```powershell
npm run languages:generate
npm test
```

The generator discovers translation files, adds bundled languages to the settings schema, and writes VS Code's `package.nls.json` and `package.nls.<vscodeLocale>.json`. Partial manifest translations fall back to English. Removing a language removes only its previously generated nls files, tracked in `generated.json`. Invalid codes, duplicate vscodeLocale values and mismatched placeholders stop generation.

Edit `interface_*.json`, rather than generated root `package.nls*.json`. To include a language in the shared release, submit the source translation and generated files in a pull request. Reload Window after installing an updated build so VS Code reloads its manifest.

`catalog.cjs` is the project's own loader/validator shared by runtime and generation. No additional npm runtime dependency is required.
