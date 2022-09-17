#!/bin/bash

if [[ -z "$1" ]]; then
  echo "cannot install: path not provided"
  exit 1
fi
echo "Installing extensions in $1"

cd "$(dirname "$0")"

if [ ! -d "$1/plugins" ]; then
  mkdir "$1/plugins"
fi
if [ ! -d "$1/plugins/@houdoku" ]; then
  mkdir "$1/plugins/@houdoku"
fi

for EXTENSION_DIR in ../extensions/*/; do
  if [ ! -d "$EXTENSION_DIR/dist" ]; then
    echo "Skipping install for $(basename $EXTENSION_DIR) because it has not been built"
    continue
  fi
  echo "Installing extension $(basename $EXTENSION_DIR)"

  INSTALL_PATH="$1/plugins/@houdoku/extension-$(basename $EXTENSION_DIR)"
  if [ ! -d "$INSTALL_PATH" ]; then
    mkdir $INSTALL_PATH
  fi

  cp -r $EXTENSION_DIR/dist $INSTALL_PATH
  cp $EXTENSION_DIR/package.json $INSTALL_PATH

  # somewhat overkill for the modules each extension actually needs,
  # but shouldn't take too much extra space
  rsync -r ../node_modules $INSTALL_PATH --exclude 'typescript' --exclude 'electron' --exclude '.bin'
done
