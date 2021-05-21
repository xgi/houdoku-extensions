#!/bin/bash

if [[ -z "$1" ]]; then
  echo "cannot build: extension name not provided"
  exit 1
fi
echo "Building extension '$1'"

cd "$(dirname "$0")"

EXTENSION_PACKAGE_JSON=../lib/extension.package.json
EXTENSION_TSCONFIG_JSON=../lib/extension.tsconfig.json

EXTENSION_DIR=../extensions/$1

cp $EXTENSION_PACKAGE_JSON $EXTENSION_DIR/package.json
cp $EXTENSION_TSCONFIG_JSON $EXTENSION_DIR/tsconfig.json

EXTENSION_NAME=$(jq -r '.name' $EXTENSION_DIR/metadata.json)
EXTENSION_ID=$(jq -r '.id' $EXTENSION_DIR/metadata.json)
EXTENSION_URL=$(jq -r '.url' $EXTENSION_DIR/metadata.json)

NAME="@houdoku/extension-"$(basename $EXTENSION_DIR)
DESCRIPTION="$EXTENSION_NAME - $EXTENSION_ID - $EXTENSION_URL"
VERSION=$(jq -r '.version' $EXTENSION_DIR/metadata.json)

cd $EXTENSION_DIR
tsc

INDEX_PATH=$(find . -name "index.js")

echo $(jq \
  --arg main "$INDEX_PATH" \
  --arg name "$NAME" \
  --arg description "$DESCRIPTION" \
  --arg version "$VERSION" \
  '.main=$main | .name=$name | .description=$description | .version=$version' \
  package.json) >package.json

cd - >/dev/null
