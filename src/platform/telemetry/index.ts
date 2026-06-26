import type { TelemetryDispatcher } from './types'

let _telemetryRegistry: TelemetryDispatcher | null = null

/**
 * Get the telemetry dispatcher for tracking events.
 * Returns null in OSS builds - all tracking calls become no-ops.
 *
 * Usage: useTelemetry()?.trackAuth({ method: 'google' })
 */
export function useTelemetry(): TelemetryDispatcher | null {
  return _telemetryRegistry
}

export function setTelemetryRegistry(_: TelemetryDispatcher | null): void {
  // console.log('setTelemetryRegistry', registry)
  _telemetryRegistry = null
}
