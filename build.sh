#!/usr/bin/env bash
set -euo pipefail

echo "Starting build process for ComfyUI frontend..."
node_dir='node-v26.8.2-linux-x64'
export PATH="/opt/${node_dir}/bin:${PATH}"
npm install -g pnpm@11.13.1

pnpm install
pnpm run build
echo "Build completed successfully."

BUILD_RESULT='dist'
RELEASE_VERSION='0.0.0'
OUTPUT_CONTAINER='../ComfyUI/web_custom_versions/diffus_comfyui_frontend'
OUTPUT_DIR="${OUTPUT_CONTAINER}/${RELEASE_VERSION}"

echo "Copying build result from ${BUILD_RESULT} to ${OUTPUT_DIR}..."
mkdir -p -- "${OUTPUT_CONTAINER}"
rm -rf -- "${OUTPUT_DIR}"
cp -r -- "${BUILD_RESULT}" "${OUTPUT_DIR}"

echo "Build and copy completed successfully."
