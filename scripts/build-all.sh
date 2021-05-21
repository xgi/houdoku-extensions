#!/bin/bash

cd "$(dirname "$0")"

for EXTENSION_DIR in ../extensions/*/; do
  ./build-one.sh $(basename $EXTENSION_DIR)
done
