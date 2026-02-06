/**
 * Vue DevTools Integration for E-IMZO SDK
 *
 * Provides custom inspector and timeline integration for Vue DevTools.
 *
 * @packageDocumentation
 */

import type { App, Ref } from 'vue'
import type { Certificate, ConnectionState, RetryInfo } from '@eimzo/core'

// DevTools API types (from @vue/devtools-api)
interface DevtoolsPluginApi {
  addInspector(options: { id: string; label: string; icon?: string }): void

  sendInspectorTree(inspectorId: string, payload: { data: InspectorNode[] }): void

  sendInspectorState(
    inspectorId: string,
    payload: {
      state: Record<string, { key: string; value: unknown; editable?: boolean }[]>
    }
  ): void

  on: {
    getInspectorTree(cb: (payload: { inspectorId: string; app: App }) => void): void
    getInspectorState(
      cb: (payload: { inspectorId: string; nodeId: string; app: App }) => void
    ): void
  }

  addTimelineLayer(options: { id: string; label: string; color: number }): void

  addTimelineEvent(options: {
    layerId: string
    event: {
      title: string
      subtitle?: string
      time: number
      data?: Record<string, unknown>
      groupId?: string | number
      meta?: Record<string, unknown>
    }
  }): void

  notifyComponentUpdate(): void
}

interface InspectorNode {
  id: string
  label: string
  children?: InspectorNode[]
  tags?: { label: string; textColor: number; backgroundColor: number }[]
}

// State tracking for DevTools
interface EIMZODevToolsState {
  connectionState: Ref<ConnectionState>
  certificates: Ref<Certificate[]>
  loadedCert: Ref<Certificate | null>
  loadedKeyId: Ref<string | null>
  isLoading: Ref<boolean>
  error: Ref<string | null>
  retryInfo: Ref<RetryInfo | null>
  failureCount: Ref<number>
  lastSuccessTime: Ref<Date | null>
}

// Colors for timeline events
const COLORS = {
  green: 0x42b983,
  blue: 0x3b82f6,
  red: 0xef4444,
  yellow: 0xfbbf24,
  gray: 0x6b7280,
}

// Inspector ID
const INSPECTOR_ID = 'eimzo-inspector'
const TIMELINE_LAYER_ID = 'eimzo-timeline'

/**
 * Setup Vue DevTools integration
 */
export function setupDevtools(app: App, state: EIMZODevToolsState): void {
  // Check if DevTools API is available
  const target = (typeof window !== 'undefined' ? window : {}) as {
    __VUE_DEVTOOLS_PLUGIN_API_AVAILABLE__?: boolean
  }

  if (!target.__VUE_DEVTOOLS_PLUGIN_API_AVAILABLE__) {
    return
  }

  // Dynamically import DevTools API
  import('@vue/devtools-api')
    .then(({ setupDevtoolsPlugin }) => {
      // DevTools API has complex typing with circular references, cast to bypass
      const setup = setupDevtoolsPlugin as (
        pluginDescriptor: {
          id: string
          label: string
          packageName: string
          homepage: string
          logo: string
          componentStateTypes: string[]
          app: App
        },
        setupFn: (api: DevtoolsPluginApi) => void
      ) => void

      setup(
        {
          id: 'eimzo-devtools',
          label: 'E-IMZO',
          packageName: '@eimzo/vue',
          homepage: 'https://github.com/sanjarbarakayev/eimzo',
          logo: 'https://e-imzo.uz/favicon.ico',
          componentStateTypes: ['E-IMZO'],
          app,
        },
        (api: DevtoolsPluginApi) => {
          // Add inspector
          api.addInspector({
            id: INSPECTOR_ID,
            label: 'E-IMZO',
            icon: 'key',
          })

          // Add timeline layer
          api.addTimelineLayer({
            id: TIMELINE_LAYER_ID,
            label: 'E-IMZO Events',
            color: COLORS.green,
          })

          // Handle inspector tree requests
          api.on.getInspectorTree((payload) => {
            if (payload.inspectorId !== INSPECTOR_ID) return

            const nodes: InspectorNode[] = [
              {
                id: 'connection',
                label: 'Connection',
                tags: [
                  {
                    label: state.connectionState.value,
                    textColor: 0xffffff,
                    backgroundColor: getConnectionColor(state.connectionState.value),
                  },
                ],
              },
              {
                id: 'certificates',
                label: 'Certificates',
                children: state.certificates.value.map((cert, index) => ({
                  id: `cert-${index}`,
                  label: cert.CN,
                  tags: [
                    {
                      label: cert.type,
                      textColor: 0xffffff,
                      backgroundColor: COLORS.blue,
                    },
                    ...(state.loadedCert.value?.serialNumber === cert.serialNumber
                      ? [
                          {
                            label: 'LOADED',
                            textColor: 0xffffff,
                            backgroundColor: COLORS.green,
                          },
                        ]
                      : []),
                  ],
                })),
              },
              {
                id: 'state',
                label: 'State',
              },
            ]

            api.sendInspectorTree(INSPECTOR_ID, { data: nodes })
          })

          // Handle inspector state requests
          api.on.getInspectorState((payload) => {
            if (payload.inspectorId !== INSPECTOR_ID) return

            if (payload.nodeId === 'connection') {
              api.sendInspectorState(INSPECTOR_ID, {
                state: {
                  Connection: [
                    { key: 'State', value: state.connectionState.value },
                    { key: 'Is Loading', value: state.isLoading.value },
                    { key: 'Error', value: state.error.value },
                    { key: 'Failure Count', value: state.failureCount.value },
                    {
                      key: 'Last Success',
                      value: state.lastSuccessTime.value?.toISOString() ?? 'Never',
                    },
                  ],
                  'Retry Info': state.retryInfo.value
                    ? [
                        { key: 'Operation', value: state.retryInfo.value.operation },
                        { key: 'Attempt', value: state.retryInfo.value.attempt },
                        { key: 'Max Attempts', value: state.retryInfo.value.maxAttempts },
                        { key: 'Error', value: state.retryInfo.value.error },
                      ]
                    : [{ key: 'Status', value: 'No active retry' }],
                },
              })
            } else if (payload.nodeId.startsWith('cert-')) {
              const index = parseInt(payload.nodeId.replace('cert-', ''), 10)
              const cert = state.certificates.value[index]

              if (cert) {
                api.sendInspectorState(INSPECTOR_ID, {
                  state: {
                    Certificate: [
                      { key: 'Common Name (CN)', value: cert.CN },
                      { key: 'Organization (O)', value: cert.O },
                      { key: 'Type', value: cert.type },
                      { key: 'Serial Number', value: cert.serialNumber },
                      { key: 'Valid From', value: cert.validFrom.toISOString() },
                      { key: 'Valid To', value: cert.validTo.toISOString() },
                      { key: 'TIN', value: cert.TIN ?? 'N/A' },
                      { key: 'PINFL', value: cert.PINFL ?? 'N/A' },
                    ],
                    Status: [
                      {
                        key: 'Is Loaded',
                        value: state.loadedCert.value?.serialNumber === cert.serialNumber,
                      },
                      {
                        key: 'Is Expired',
                        value: new Date() > cert.validTo,
                      },
                      {
                        key: 'Days Until Expiry',
                        value: Math.ceil(
                          (cert.validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                        ),
                      },
                    ],
                  },
                })
              }
            } else if (payload.nodeId === 'state') {
              api.sendInspectorState(INSPECTOR_ID, {
                state: {
                  'Current State': [
                    { key: 'Connection State', value: state.connectionState.value },
                    { key: 'Is Loading', value: state.isLoading.value },
                    { key: 'Error', value: state.error.value },
                    { key: 'Certificates Count', value: state.certificates.value.length },
                    { key: 'Loaded Certificate', value: state.loadedCert.value?.CN ?? 'None' },
                    { key: 'Loaded Key ID', value: state.loadedKeyId.value ?? 'None' },
                  ],
                },
              })
            } else if (payload.nodeId === 'certificates') {
              api.sendInspectorState(INSPECTOR_ID, {
                state: {
                  Summary: [
                    { key: 'Total', value: state.certificates.value.length },
                    {
                      key: 'By Type',
                      value: getCertificatesByType(state.certificates.value),
                    },
                    {
                      key: 'Expired',
                      value: state.certificates.value.filter((c) => new Date() > c.validTo).length,
                    },
                  ],
                },
              })
            }
          })

          // Create event emitter
          const emitEvent = (
            title: string,
            subtitle?: string,
            data?: Record<string, unknown>,
            color: number = COLORS.green
          ) => {
            api.addTimelineEvent({
              layerId: TIMELINE_LAYER_ID,
              event: {
                title,
                subtitle,
                time: Date.now(),
                data,
                meta: { color },
              },
            })
          }

          // Export emit function for use in composable
          ;(app as { _eimzoDevtools?: { emitEvent: typeof emitEvent } })._eimzoDevtools = {
            emitEvent,
          }
        }
      )
    })
    .catch(() => {
      // DevTools API not available, silently ignore
    })
}

/**
 * Get color for connection state
 */
function getConnectionColor(state: ConnectionState): number {
  switch (state) {
    case 'connected':
      return COLORS.green
    case 'connecting':
    case 'retrying':
      return COLORS.yellow
    case 'error':
      return COLORS.red
    case 'disconnected':
    default:
      return COLORS.gray
  }
}

/**
 * Get certificates grouped by type
 */
function getCertificatesByType(certificates: Certificate[]): Record<string, number> {
  return certificates.reduce(
    (acc, cert) => {
      acc[cert.type] = (acc[cert.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
}

/**
 * Emit a DevTools timeline event
 */
export function emitDevToolsEvent(
  app: App | undefined,
  title: string,
  subtitle?: string,
  data?: Record<string, unknown>,
  type: 'success' | 'error' | 'info' = 'info'
): void {
  if (!app) return

  const devtools = (app as { _eimzoDevtools?: { emitEvent: Function } })._eimzoDevtools

  if (devtools) {
    const color = type === 'success' ? COLORS.green : type === 'error' ? COLORS.red : COLORS.blue

    devtools.emitEvent(title, subtitle, data, color)
  }
}
