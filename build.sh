#!/bin/bash
echo "Starting build process for ComfyUI frontend..."
node=node-v25.9.0-linux-x64
export PATH="/opt/${node}/bin":$PATH
npm install -g pnpm || exit 1

pnpm install || exit 1
pnpm run build || exit 1
echo "Build completed successfully."

echo "Copying build result from ${BUILD_RESULT} to ${OUTPUT_DIR}..."
BUILD_RESULT='dist'

RELEASE_VERSION='0.0.0'
OUTPUT_CONTAINER='../ComfyUI/web_custom_versions/diffus_comfyui_frontend'
OUTPUT_DIR="${OUTPUT_CONTAINER}/${RELEASE_VERSION}"

if [ ! -d "${OUTPUT_CONTAINER}" ]; then
    mkdir -p ${OUTPUT_CONTAINER}
fi
rm -rf ${OUTPUT_DIR}
cp -r ${BUILD_RESULT} ${OUTPUT_DIR}

echo "Build and copy completed successfully."
