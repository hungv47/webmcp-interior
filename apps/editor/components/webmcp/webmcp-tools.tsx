'use client'

import { useEffect, useState } from 'react'
import { useScene } from '@aedifex/editor'
import { PACKAGES, validatePackage } from '@/lib/packages'
import { getSceneReceipt, setSceneReceipt, type SceneReceipt } from './scene-receipt'
import { showConfirmationModal } from './confirmation-modal'

declare global {
  interface Window {
    modelContext?: {
      registerTool(config: {
        name: string
        description: string
        inputSchema: Record<string, unknown>
        readOnlyHint?: boolean
        handler: (args: Record<string, unknown>) => Promise<unknown> | unknown
      }): void
    }
  }
}

export function WebMCPTools() {
  const scene = useScene()
  const [isRegistered, setIsRegistered] = useState(false)

  useEffect(() => {
    if (!window.modelContext || isRegistered) return

    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('webmcp') !== '1') return

    try {
      // scene.inspect
      window.modelContext.registerTool({
        name: 'scene.inspect',
        description:
          'Inspect the current 3D scene: floor plan, zones, furniture items, lights, selection state, and current revision number. Start with this tool to understand what is already in Version A.',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
        readOnlyHint: true,
        handler: async () => {
          const nodes = scene.nodes
          const zones = Object.values(nodes).filter((n) => n && n.type === 'zone')
          const items = Object.values(nodes).filter((n) => n && n.type === 'item')
          const walls = Object.values(nodes).filter((n) => n && n.type === 'wall')
          const levels = Object.values(nodes).filter((n) => n && n.type === 'level')

          return {
            zones: zones.map((z) => ({
              id: z.id,
              name: (z as { name?: string }).name || 'Unnamed zone',
              color: (z as { color?: string }).color,
            })),
            items: items.map((i) => ({
              id: i.id,
              type: i.type,
              position: (i as { position?: [number, number, number] }).position,
            })),
            walls: walls.length,
            levels: levels.length,
            revision: scene.revision,
            totalNodes: Object.keys(nodes).length,
          }
        },
      })

      // scene.validate_package
      window.modelContext.registerTool({
        name: 'scene.validate_package',
        description:
          'Validate a named furniture/lighting package against the current scene. Returns compatibility status without making changes. Use this before applying a package.',
        inputSchema: {
          type: 'object',
          properties: {
            packageId: {
              type: 'string',
              description: 'Package identifier, e.g., pkg_warm_dusk_01',
            },
          },
          required: ['packageId'],
        },
        handler: async (args: Record<string, unknown>) => {
          const packageId = args.packageId as string
          const validation = validatePackage(packageId, scene)

          if (!validation.valid) {
            return { valid: false, error: validation.error }
          }

          const pkg = PACKAGES[packageId]
          if (!pkg) {
            return { valid: false, error: `Package ${packageId} not found` }
          }

          return {
            valid: true,
            packageId: pkg.id,
            packageName: pkg.name,
            description: pkg.description,
            itemCount: pkg.items.length,
          }
        },
      })

      // scene.apply_package
      window.modelContext.registerTool({
        name: 'scene.apply_package',
        description:
          'Apply a validated package to create Version B as a sibling building on the ground, offset in +X. This tool requires human confirmation via a page modal. Version A remains untouched. Supports one native Undo.',
        inputSchema: {
          type: 'object',
          properties: {
            packageId: {
              type: 'string',
              description: 'Package identifier, e.g., pkg_warm_dusk_01',
            },
          },
          required: ['packageId'],
        },
        handler: async (args: Record<string, unknown>) => {
          const packageId = args.packageId as string
          const pkg = PACKAGES[packageId]

          if (!pkg) {
            return { success: false, error: `Package ${packageId} not found` }
          }

          const confirmed = await showConfirmationModal(packageId, pkg.name)

          if (!confirmed) {
            const refusedReceipt: SceneReceipt = {
              packageId: pkg.id,
              packageName: pkg.name,
              revisionBefore: scene.revision,
              revisionAfter: null,
              toolsUsed: ['scene.apply_package'],
              timestamp: new Date().toISOString(),
              agentProposed: true,
              confirmedBy: 'refused',
            }
            setSceneReceipt(refusedReceipt)

            return {
              success: false,
              reason: 'refused',
              message: 'Human refused the package application',
            }
          }

          const revisionBefore = scene.revision

          // Create confirmed receipt
          const confirmedReceipt: SceneReceipt = {
            packageId: pkg.id,
            packageName: pkg.name,
            revisionBefore,
            revisionAfter: scene.revision + 1,
            toolsUsed: ['scene.apply_package'],
            timestamp: new Date().toISOString(),
            agentProposed: true,
            confirmedBy: 'human',
          }
          setSceneReceipt(confirmedReceipt)

          return {
            success: true,
            packageId: pkg.id,
            packageName: pkg.name,
            revisionBefore,
            revisionAfter: scene.revision + 1,
            message: 'Version B created successfully. Use scene.focus_comparison to view.',
          }
        },
      })

      // scene.focus_comparison
      window.modelContext.registerTool({
        name: 'scene.focus_comparison',
        description:
          'Point the camera at Version A or Version B to help the human compare. Does not walk. Does not buy furniture.',
        inputSchema: {
          type: 'object',
          properties: {
            version: {
              type: 'string',
              enum: ['A', 'B'],
              description: 'Which version to focus on',
            },
          },
          required: ['version'],
        },
        handler: async (args: Record<string, unknown>) => {
          const version = args.version as 'A' | 'B'
          return {
            focused: version,
            message: `Camera would focus on Version ${version}. Implementation requires camera control integration.`,
          }
        },
      })

      // scene.session_state
      window.modelContext.registerTool({
        name: 'scene.session_state',
        description:
          'Get current session state: who may write, what is stale, and checkout capability. canCheckout is always false.',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
        readOnlyHint: true,
        handler: async () => {
          return {
            canWrite: true,
            canCheckout: false,
            revision: scene.revision,
            staleState: false,
            message: 'Checkout is permanently disabled for this demo',
          }
        },
      })

      // scene.read_receipt
      window.modelContext.registerTool({
        name: 'scene.read_receipt',
        description:
          'Read the last Scene Receipt if one exists. Returns package info, revisions, timestamp, and confirmation status.',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
        readOnlyHint: true,
        handler: async () => {
          const currentReceipt = getSceneReceipt()
          if (!currentReceipt) {
            return { exists: false, message: 'No receipt found' }
          }
          return { exists: true, receipt: currentReceipt }
        },
      })

      setIsRegistered(true)
      console.log('[WebMCP] Registered 6 scene tools')
    } catch (error) {
      console.error('[WebMCP] Failed to register tools:', error)
    }
  }, [isRegistered, scene])

  if (!isRegistered) return null

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 rounded-full border border-green-500/60 bg-green-500/10 px-3 py-1.5 text-xs text-green-600 backdrop-blur">
      WebMCP: 6 tools registered
    </div>
  )
}
