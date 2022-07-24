# houdoku-extensions

This repository contains extensions for
[Houdoku](https://github.com/xgi/houdoku), a manga reader for the
desktop. Houdoku users can install and load extensions at runtime
independent of the client version.

The authoritative list of available extensions is the
[@houdoku scope on the npm registry](https://www.npmjs.com/search?q=scope%3Ahoudoku).

## Development

### API

Definitions for functions that extensions should implement are in the
[houdoku-extension-lib repo](https://github.com/xgi/houdoku-extension-lib).

In particular, see the
[interface](https://github.com/xgi/houdoku-extension-lib/blob/master/src/interface.ts)
source, which has full method documentation.

### Testing

The testing workflow is intended both for development and for
identifying when source websites introduce breaking changes. Therefore
tests do not mock internet responses and are erratic.

```bash
# Run all tests for all extensions (may take a while)
npm run test

# Run all tests for a specific extension
npm run test-base -- test/extensions/guya.test.ts

# Run specific tests for a specific extension
npm run test-base -- test/extensions/guya.test.ts --grep "directory has"
```

### Building

An additional way to test is by building extensions and copying them into the Houdoku
plugin directory, making them usable as if they were installed from the app.
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
# If the app is currently running, reload the extensions:
#  Extensions->View Installed Extensions->Reload Extensions
./scripts/manual-install-all.sh INSTALL_DIR
```

## Related Projects

- [houdoku](https://github.com/xgi/houdoku) - the application itself
- [houdoku-extension-lib](https://github.com/xgi/houdoku-extension-lib) -
  interface library for extensions, used by extensions and the client
- [aki-plugin-manager](https://github.com/xgi/aki-plugin-manager) - the
  utility used by Houdoku to find/install/load extensions, independent of
  Houdoku's functionality
