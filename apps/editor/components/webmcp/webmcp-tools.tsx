'use client'

import { useEffect, useState } from 'react'
import { emitter, useScene, type AnyNodeId, ItemNode, BuildingNode, LevelNode, cloneSceneGraph, type SceneGraph } from '@aedifex/core'
import { PACKAGES, validatePackage, type PackageItem } from '@/lib/packages'
import { getSceneReceipt, setSceneReceipt, type SceneReceipt } from './scene-receipt'
import { showConfirmationModal } from './confirmation-modal'
import { CATALOG_ITEMS } from '@aedifex/editor/components/ui/item-catalog/catalog-items'

declare global {
  interface Navigator {
    modelContext?: {
      registerTool(config: {
        name: string
        description: string
        inputSchema: Record<string, unknown>
        readOnlyHint?: boolean
        execute: (args: Record<string, unknown>) => Promise<unknown>
      }): void
    }
  }
  interface Document {
    modelContext?: {
      registerTool(config: {
        name: string
        description: string
        inputSchema: Record<string, unknown>
        readOnlyHint?: boolean
        execute: (args: Record<string, unknown>) => Promise<unknown>
      }): void
    }
  }
}

let versionBBuildingId: string | null = null

function cloneApartmentForVersionB(originalBuildingId: string, packageItems: PackageItem[]): {
  buildingId: string
  clonedNodes: number
} | null {
  const scene = useScene.getState()
  const originalBuilding = scene.nodes[originalBuildingId as AnyNodeId]
  
  if (!originalBuilding || originalBuilding.type !== 'building') {
    return null
  }

  const buildingNode = originalBuilding as BuildingNode
  const siteId = buildingNode.parentId
  if (!siteId) return null

  const originalPosition = buildingNode.position || [0, 0, 0]
  const offsetX = 15

  const buildingSubtree = new Set<string>([originalBuildingId])
  const queue = [originalBuildingId]

  while (queue.length > 0) {
    const nodeId = queue.shift()!
    const node = scene.nodes[nodeId as AnyNodeId]
    if (!node) continue

    if ('children' in node && Array.isArray(node.children)) {
      for (const childId of node.children) {
        if (!buildingSubtree.has(childId as string)) {
          buildingSubtree.add(childId as string)
          queue.push(childId as string)
        }
      }
    }
  }

  const subtreeNodes = {} as Record<AnyNodeId, any>
  for (const id of buildingSubtree) {
    subtreeNodes[id as AnyNodeId] = scene.nodes[id as AnyNodeId]
  }

  const clonedGraph = cloneSceneGraph({
    nodes: subtreeNodes,
    rootNodeIds: [originalBuildingId as AnyNodeId],
  })

  const newBuildingId = clonedGraph.rootNodeIds[0]
  const newBuildingNode = clonedGraph.nodes[newBuildingId] as BuildingNode

  const offsetBuildingNode = {
    ...newBuildingNode,
    position: [originalPosition[0] + offsetX, originalPosition[1], originalPosition[2]] as [number, number, number],
    parentId: siteId,
  }

  for (const [nodeId, node] of Object.entries(clonedGraph.nodes)) {
    if (nodeId === newBuildingId) {
      scene.nodes[nodeId as AnyNodeId] = offsetBuildingNode as any
    } else {
      scene.nodes[nodeId as AnyNodeId] = node
    }
  }

  const siteNode = scene.nodes[siteId]
  if (siteNode && 'children' in siteNode && Array.isArray(siteNode.children)) {
    scene.nodes[siteId] = {
      ...siteNode,
      children: [...siteNode.children, newBuildingId as any],
    } as any
  }

  const firstLevel = Object.values(clonedGraph.nodes)
    .filter((n) => n && n.type === 'level' && (n as LevelNode).parentId === newBuildingId)
    .sort((a, b) => ((a as LevelNode).level || 0) - ((b as LevelNode).level || 0))[0]

  if (firstLevel) {
    for (const pkgItem of packageItems) {
      const catalogItem = CATALOG_ITEMS.find((item) => item.id === pkgItem.catalogId)
      if (!catalogItem) continue

      try {
        const itemId = scene.createNode(
          ItemNode.parse({
            position: pkgItem.position,
            rotation: pkgItem.rotation,
            asset: {
              id: catalogItem.id,
              name: catalogItem.name,
              category: catalogItem.category,
              thumbnail: catalogItem.thumbnail,
              src: catalogItem.src,
              floorPlanUrl: catalogItem.floorPlanUrl,
              dimensions: catalogItem.dimensions,
              offset: catalogItem.offset || [0, 0, 0],
              rotation: catalogItem.rotation || [0, 0, 0],
              scale: catalogItem.scale || [1, 1, 1],
            },
          }),
          firstLevel.id as AnyNodeId,
        )
      } catch (error) {
        console.warn(`[Room vibe] Failed to place item ${pkgItem.catalogId}:`, error)
      }
    }
  }

  scene.revision++

  return {
    buildingId: newBuildingId as string,
    clonedNodes: Object.keys(clonedGraph.nodes).length,
  }
}

export function WebMCPTools() {
  const [toolStatus, setToolStatus] = useState<'pending' | 'registered' | 'hidden'>('pending')

  useEffect(() => {
    let attemptCount = 0
    const maxAttempts = 50
    const retryInterval = 100

    const tryRegister = () => {
      attemptCount++

      const modelContext = navigator.modelContext || document.modelContext
      if (!modelContext) {
        if (attemptCount < maxAttempts) {
          setTimeout(tryRegister, retryInterval)
        } else {
          console.warn('[WebMCP] modelContext never appeared after', maxAttempts, 'attempts')
          setToolStatus('hidden')
        }
        return
      }

      try {
        modelContext.registerTool({
          name: 'scene.inspect',
          description:
            'Inspect the current 3D scene: floor plan, zones, furniture items, lights, selection state, and current revision number. Start with this tool to understand what is already in Version A.',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
          readOnlyHint: true,
          execute: async () => {
            const scene = useScene.getState()
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

        modelContext.registerTool({
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
          execute: async (args: Record<string, unknown>) => {
            const scene = useScene.getState()
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

        modelContext.registerTool({
          name: 'scene.apply_package',
          description:
            'Apply a validated package to create Version B as a sibling apartment on the ground, offset in +X. This tool requires human confirmation via a page modal. Version A remains untouched. Supports one native Undo.',
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
          execute: async (args: Record<string, unknown>) => {
            const packageId = args.packageId as string
            const pkg = PACKAGES[packageId]

            if (!pkg) {
              return { success: false, error: `Package ${packageId} not found` }
            }

            const confirmed = await showConfirmationModal(packageId, pkg.name)

            if (!confirmed) {
              const scene = useScene.getState()
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

            const scene = useScene.getState()
            const revisionBefore = scene.revision

            const buildings = Object.values(scene.nodes).filter((n) => n && n.type === 'building')
            const firstBuilding = buildings[0]

            if (!firstBuilding) {
              return { success: false, error: 'No building found in scene' }
            }

            const result = cloneApartmentForVersionB(firstBuilding.id, pkg.items)

            if (!result) {
              return { success: false, error: 'Failed to create Version B' }
            }

            versionBBuildingId = result.buildingId

            const sceneAfter = useScene.getState()
            const revisionAfter = sceneAfter.revision

            const confirmedReceipt: SceneReceipt = {
              packageId: pkg.id,
              packageName: pkg.name,
              revisionBefore,
              revisionAfter,
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
              revisionAfter,
              versionBBuildingId: result.buildingId,
              nodesCloned: result.clonedNodes,
              message:
                'Version B created successfully as a complete apartment copy offset in +X with Warm Dusk lighting. Use scene.focus_comparison to view both versions.',
            }
          },
        })

        modelContext.registerTool({
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
          execute: async (args: Record<string, unknown>) => {
            const version = args.version as 'A' | 'B'
            const scene = useScene.getState()

            const buildings = Object.values(scene.nodes).filter(
              (n) => n && n.type === 'building',
            ) as BuildingNode[]

            if (version === 'A') {
              const firstBuilding = buildings[0]
              if (firstBuilding) {
                emitter.emit('camera-controls:view', { nodeId: firstBuilding.id })
                return {
                  focused: 'A',
                  buildingId: firstBuilding.id,
                  message: 'Camera focused on Version A (original apartment)',
                }
              }
              return { focused: 'A', error: 'Version A building not found' }
            }

            if (versionBBuildingId) {
              const buildingB = scene.nodes[versionBBuildingId as AnyNodeId]
              if (buildingB && buildingB.type === 'building') {
                emitter.emit('camera-controls:view', { nodeId: versionBBuildingId as AnyNodeId })
                return {
                  focused: 'B',
                  buildingId: versionBBuildingId,
                  message: 'Camera focused on Version B (apartment with Warm Dusk package)',
                }
              }
            }

            return { focused: 'B', error: 'Version B not created yet or was undone' }
          },
        })

        modelContext.registerTool({
          name: 'scene.session_state',
          description:
            'Get current session state: who may write, what is stale, and checkout capability. canCheckout is always false.',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
          readOnlyHint: true,
          execute: async () => {
            const scene = useScene.getState()
            return {
              canWrite: true,
              canCheckout: false,
              revision: scene.revision,
              staleState: false,
              message: 'Checkout is permanently disabled for this demo',
            }
          },
        })

        modelContext.registerTool({
          name: 'scene.read_receipt',
          description:
            'Read the last Scene Receipt if one exists. Returns package info, revisions, timestamp, and confirmation status.',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
          readOnlyHint: true,
          execute: async () => {
            const currentReceipt = getSceneReceipt()
            if (!currentReceipt) {
              return { exists: false, message: 'No receipt found' }
            }
            return { exists: true, receipt: currentReceipt }
          },
        })

        setToolStatus('registered')
        console.log('[WebMCP] Registered 6 scene tools on', navigator.modelContext ? 'navigator' : 'document', '.modelContext')
        
        setTimeout(() => {
          setToolStatus('hidden')
        }, 3000)
      } catch (error) {
        console.error('[WebMCP] Failed to register tools:', error)
        setToolStatus('hidden')
      }
    }

    tryRegister()
  }, [])

  if (toolStatus === 'hidden') return null

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 rounded-full border border-emerald-500/40 bg-emerald-500/5 px-3 py-1.5 text-xs text-emerald-600 backdrop-blur transition-opacity duration-500">
      {toolStatus === 'registered' ? 'WebMCP ready' : 'Connecting...'}
    </div>
  )
}
