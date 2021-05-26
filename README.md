# houdoku-extensions

This repository contains extensions for
[Houdoku](https://github.com/xgi/houdoku), a manga reader for the
desktop. Houdoku users can install and load extensions at runtime separate
from the application itself.

Extensions are published as separate npm packages under the @houdoku scope:

- <https://www.npmjs.com/search?q=scope%3Ahoudoku>

## Development

### API

Definitions for functions that extensions should implement are in the
[houdoku-extension-lib repo](https://github.com/xgi/houdoku-extension-lib).

In particular, see the
[interface](https://github.com/xgi/houdoku-extension-lib/blob/master/src/interface.ts)
source, which has full method documentation.

### Building

Utility scripts are provided in `/scripts`:

```bash
# Clean build artifacts
./scripts/clean-all.sh

# Build all extensions (may take a while)
./scripts/build-all.sh

# Build a specific extension
./scripts/build-one.sh guya

# Manually install extensions into Houdoku for testing
#  - unbuilt extensions are automatically skipped
#  - INSTALL_DIR is Houdoku's userData directory,
#    e.g. C:/Users/user/AppData/Roaming/Electron
./scripts/manual-install-all.sh INSTALL_DIR
```

### Dependencies

Because of the way that extensions are loaded while Houdoku is running,
dependency management is rather complex. Each extension must include dependencies (not devDependencies) for any imports they do. In practice,
in order to reduce the size of each extension, we mostly only include type
definitions for packages, and have the actual functions be passed in from
the Houdoku client (like the fetch function from `node-fetch`).

Additions to dependencies are possible, but would require updates at every
layer of the application.

## Related Projects

- [houdoku](https://github.com/xgi/houdoku) - the application itself
- [houdoku-extension-lib](https://github.com/xgi/houdoku-extension-lib) -
  interface library for extensions, used by extensions and the client
- [aki-plugin-manager](https://github.com/xgi/aki-plugin-manager) - the
  utility used by Houdoku to find/install/load extensions, independent of
  Houdoku's functionality

## Extension List

This list is provided as a reference, but it is not updated automatically
and may be out-of-date; the only authoritative source is the
[@houdoku scope on the npm registry](https://www.npmjs.com/search?q=scope%3Ahoudoku).

| ID                                   | Name                  | URL                           | Notes |
| ------------------------------------ | --------------------- | ----------------------------- | ----- |
| 1010464e-0cf3-4171-a5c3-9a42b3a1fd53 | Arang Scans           | <https://arangscans.com>      |       |
| 4368cd84-6755-4308-b153-7ee8bd8f989a | CatManga              | <https://catmanga.org>        |       |
| 62bf1a27-9e9a-463d-a6ac-1a14f98a3b8f | Disaster Scans        | <https://disasterscans.com>   |       |
| 8e5f0379-3338-4045-a601-dc4e16c14c3d | Guya                  | <https://guya.moe>            |       |
| 351cd86f-10b8-4505-840c-bec6ee322f19 | Immortal Updates      | <https://immortalupdates.com> |       |
| 29fb9be0-3933-4b75-bd59-3a6a9d21d83b | IsekaiScan            | <https://isekaiscan.com>      |       |
| 1cf2993c-2219-4534-9bca-0231181e40ba | LeviatanScans         | <https://leviatanscans.com>   |       |
| c50fef38-5c90-4e3a-8730-68bc1d2af7d8 | Manga347              | <https://manga347.com>        |       |
| 6b4e9df1-b369-4adc-8d36-fe954dd793e3 | MangaDex              | <https://mangadex.org>        |       |
| bfc30edf-535d-44c6-8224-83e368235a27 | MangaKik              | <https://mangakik.com>        |       |
| 214cba07-d258-4b68-8b0e-b9da093fb942 | MangaNelo             | <https://manganelo.tv>        |       |
| 2ba694f4-97e5-459a-8f52-9d11487f3d03 | Mangarave             | <https://mangarave.com>       |       |
| cd649429-6b6a-4874-96cd-4914b64e5002 | Sleeping Knight Scans | <https://skscans.com>         |       |
| 23750732-4b05-44f3-8daf-853627f628e2 | Toonily               | <https://toonily.com>         |       |
| d7d78a43-0bef-4fb8-ae56-dc761470f0a3 | Tritinia Scans        | <https://tritinia.com>        |       |
