import type { ComfyApp } from '@/scripts/app'

interface DiffusFeaturePermissions {
  checkTierForComfyUI(): void
  openUpgradeDialogByReason(reason: string): void
  openComfyUIRewardBundleDialog(): boolean
}

interface DiffusAppBridge {
  featurePermissions: DiffusFeaturePermissions
}

export type ComfyUIHostBridge = Pick<ComfyApp, 'loadGraphData'>

declare global {
  interface Window {
    diffusApp?: DiffusAppBridge
    comfyUIApp?: ComfyUIHostBridge
  }
}

function getDiffusApp(): DiffusAppBridge | undefined {
  if (typeof window === 'undefined') return undefined

  try {
    return window.parent.diffusApp
  } catch {
    return undefined
  }
}

export function isDiffusAppAvailable(): boolean {
  return getDiffusApp() !== undefined
}

export function exposeComfyUIAppToHost(app: ComfyUIHostBridge): void {
  window.comfyUIApp = app
}

export function checkTierForPrompt(): void {
  getDiffusApp()?.featurePermissions.checkTierForComfyUI()
}

export function openUpgradeDialogByReason(reason: string): void {
  getDiffusApp()?.featurePermissions.openUpgradeDialogByReason(reason)
}

export function showComfyUIBundleDialog(): boolean {
  return (
    getDiffusApp()?.featurePermissions.openComfyUIRewardBundleDialog() ?? false
  )
}
