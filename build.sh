#!/bin/bash
echo "Starting build process for ComfyUI frontend..."
pnpm install || exit 1
pnpm run build || exit 1
echo "Build completed successfully."

echo "Copying build result from ${BUILD_RESULT} to ${OUTPUT_DIR}..."
OUTPUT_DIR='../ComfyUI/web_custom_versions/diffus_comfyui_frontend/0.0.0'
BUILD_RESULT='dist'
rm -rf ${OUTPUT_DIR}
cp -r ${BUILD_RESULT} ${OUTPUT_DIR}

echo "Build and copy completed successfully."
