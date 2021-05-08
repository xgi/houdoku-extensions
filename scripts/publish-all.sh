#!/bin/bash

cd "$(dirname "$0")"

for EXTENSION_DIR in ../extensions/*/; do
  cd $EXTENSION_DIR

  npm publish --access public

  cd - >/dev/null
done
