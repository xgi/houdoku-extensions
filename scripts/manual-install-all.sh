#!/bin/bash

cd "$(dirname "$0")"

if [ ! -d "$1/plugins" ]; then
  mkdir "$1/plugins"
fi
if [ ! -d "$1/plugins/@houdoku" ]; then
  mkdir "$1/plugins/@houdoku"
fi

for EXTENSION_DIR in ../extensions/*/; do
  INSTALL_PATH="$1/plugins/@houdoku/extension-$(basename $EXTENSION_DIR)"
  if [ ! -d "$INSTALL_PATH" ]; then
    mkdir $INSTALL_PATH
  fi

  cp -r $EXTENSION_DIR/dist $INSTALL_PATH
  cp $EXTENSION_DIR/package.json $INSTALL_PATH

  # somewhat overkill for the modules each extension actually needs,
  # but shouldn't take too much extra space
  rsync -r ../node_modules $INSTALL_PATH --exclude 'typescript' --exclude '.bin'
done
