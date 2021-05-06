#!/bin/bash

cd "$(dirname "$0")"

for EXTENSION_DIR in ../extensions/*/; do
  PACKAGE_JSON=$EXTENSION_DIR/package.json
  TSCONFIG_JSON=$EXTENSION_DIR/tsconfig.json
  DIST=$EXTENSION_DIR/dist

  if [ -f $PACKAGE_JSON ]; then
    rm $PACKAGE_JSON
  fi

  if [ -f $TSCONFIG_JSON ]; then
    rm $TSCONFIG_JSON
  fi

  if [ -d $DIST ]; then
    rm -r $DIST
  fi
done
