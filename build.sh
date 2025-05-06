#!/bin/bash
npm run build

OUTPUT_DIR='../ComfyUI/web_custom_versions/diffus_comfyui_frontend/0.0.0'
BUILD_RESULT='dist'

rm -rf ${OUTPUT_DIR}
cp -r ${BUILD_RESULT} ${OUTPUT_DIR}
