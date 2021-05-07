# houdoku-extensions

This repository contains extensions for
[Houdoku](https://github.com/xgi/houdoku), a manga reader for the
desktop. Houdoku users can install and load extensions at runtime separate
from the application itself.

Extensions are published as separate npm packages. For a list of published
extensions, check the @houdoku scope on the npm registry:

- https://www.npmjs.com/search?q=%40houdoku

## Development

### API

Definitions for functions that extensions should implement are in the
[houdoku-extension-lib repo](https://github.com/xgi/houdoku-extension-lib).

In particular, see the
[interface](https://github.com/xgi/houdoku-extension-lib/blob/master/src/interface.ts)
source, which has full method documentation.

### Building

All extensions use a common base `package.json` and `tsconfig.json` which
is copied/edited on build. Use `scripts/build-all.sh` to build.

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
