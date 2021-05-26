#!/bin/bash

cd "$(dirname "$0")"

OUTPATH="extension_table.md"

echo "| ID | Name | URL | Notes |" >$OUTPATH
echo "| - | - | - | - |" >>$OUTPATH

for EXTENSION_DIR in ../extensions/*/; do
  cd $EXTENSION_DIR

  EXTENSION_NAME=$(jq -r '.name' metadata.json)
  EXTENSION_ID=$(jq -r '.id' metadata.json)
  EXTENSION_URL=$(jq -r '.url' metadata.json)

  cd - >/dev/null
  echo "| $EXTENSION_ID | $EXTENSION_NAME | <$EXTENSION_URL> | |" >>$OUTPATH
done
