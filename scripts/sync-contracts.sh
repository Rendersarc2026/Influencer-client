#!/usr/bin/env bash
set -euo pipefail

CONTRACTS_SOURCE="${CONTRACTS_SRC:-../Influencer-server/src/contracts}"
TARGET_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/src/contracts"

if [ ! -d "$CONTRACTS_SOURCE" ]; then
  echo "Error: Contracts source directory '$CONTRACTS_SOURCE' does not exist."
  exit 1
fi

echo "Syncing contracts from $CONTRACTS_SOURCE to $TARGET_DIR..."
mkdir -p "$TARGET_DIR"
rm -rf "${TARGET_DIR:?}"/*
cp -R "$CONTRACTS_SOURCE"/* "$TARGET_DIR/"
echo "Contracts synchronized successfully."
