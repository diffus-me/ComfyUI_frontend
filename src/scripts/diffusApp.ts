import type { ComfyApp } from '@/scripts/app'

interface DiffusFeaturePermissions {
  checkTierForComfyUI(): void
  openUpgradeDialogByReason(reason: string): void
  openComfyUIRewardBundleDialog(): boolean
}

type DiffusModelSelectorFilterValue = string | string[]

export interface DiffusModelSelectorOptions {
  filter: Record<string, DiffusModelSelectorFilterValue>
  lockedFilterKeys?: string[]
}

export interface DiffusModelSelectorResult {
  title: string
  value: string
  filename: string
}

interface DiffusAppBridge {
  featurePermissions: DiffusFeaturePermissions
  openModelSelector?: (
    options: DiffusModelSelectorOptions
  ) => Promise<DiffusModelSelectorResult | undefined>
  toast?: {
    error(options: { title: string; description?: string }): void
  }
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

export function isDiffusModelSelectorAvailable(): boolean {
  return getDiffusApp()?.openModelSelector !== undefined
}

export async function openDiffusModelSelector(
  options: DiffusModelSelectorOptions
): Promise<DiffusModelSelectorResult | undefined> {
  return getDiffusApp()?.openModelSelector?.(options)
}

export function showDiffusModelSelectorError(message: string): void {
  getDiffusApp()?.toast?.error({ title: message })
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
