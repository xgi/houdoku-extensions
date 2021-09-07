#!/bin/bash

cd "$(dirname "$0")"

OUTPATH="extension_table.md"

echo "| Name | URL | Version | Language |" >$OUTPATH
echo "| - | - | - | - |" >>$OUTPATH

for EXTENSION_DIR in ../extensions/*/; do
  cd $EXTENSION_DIR

  EXTENSION_NAME=$(jq -r '.name' metadata.json)
  EXTENSION_URL=$(jq -r '.url' metadata.json)
  EXTENSION_VERSION=$(jq -r '.version' metadata.json)
  EXTENSION_LANGUAGE=$(jq -r '.translatedLanguage' metadata.json)

  cd - >/dev/null
  echo "| $EXTENSION_NAME | <$EXTENSION_URL> | $EXTENSION_VERSION | $EXTENSION_LANGUAGE |" >>$OUTPATH
done
