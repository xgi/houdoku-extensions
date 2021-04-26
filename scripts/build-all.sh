#!/bin/bash

EXTENSION_PACKAGE_JSON=../lib/extension.package.json
EXTENSION_TSCONFIG_JSON=../lib/extension.tsconfig.json

for EXTENSION_DIR in ../extensions/*/; do
  cp $EXTENSION_PACKAGE_JSON $EXTENSION_DIR/package.json
  cp $EXTENSION_TSCONFIG_JSON $EXTENSION_DIR/tsconfig.json

  EXTENSION_NAME=$(jq -r '.name' $EXTENSION_DIR/metadata.json)

  NAME="extension-"$EXTENSION_NAME
  DESCRIPTION="Houdoku extension for $EXTENSION_NAME"
  VERSION=$(jq -r '.version' $EXTENSION_DIR/metadata.json)

  echo $(jq \
    --arg name "$NAME" \
    --arg description "$DESCRIPTION" \
    --arg version "$VERSION" \
    '.name=$name, .description=$description, .version=$version' \
    $EXTENSION_DIR/package.json) > $EXTENSION_DIR/package.json

  cd $EXTENSION_DIR
  tsc

  cd - > /dev/null
done
