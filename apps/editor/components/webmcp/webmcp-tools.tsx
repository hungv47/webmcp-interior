'use client'

import { useEffect } from 'react'
import { emitter, useScene, type AnyNodeId, ItemNode, BuildingNode, LevelNode, cloneSceneGraph } from '@aedifex/core'
import { PACKAGES, validatePackage, type PackageItem } from '@/lib/packages'
import { getSceneReceipt, setSceneReceipt, type SceneReceipt } from './scene-receipt'
import { showConfirmationModal } from './confirmation-modal'
import { CATALOG_ITEMS } from '@aedifex/editor'
import { webmcpEvents } from './events'

declare global {
  interface Navigator {
    modelContext?: {
      registerTool(config: {
        name: string
        description: string
        inputSchema: Record<string, unknown>
        annotations?: {
          readOnlyHint?: boolean
        }
        signal?: AbortSignal
        execute: (args: Record<string, unknown>) => Promise<unknown>
      }): Promise<void>
    }
  }
  interface Document {
    modelContext?: {
      registerTool(config: {
        name: string
        description: string
        inputSchema: Record<string, unknown>
        annotations?: {
          readOnlyHint?: boolean
        }
        signal?: AbortSignal
        execute: (args: Record<string, unknown>) => Promise<unknown>
      }): Promise<void>
    }
  }
}

let versionBBuildingId: string | null = null

function cloneApartmentForVersionB(originalBuildingId: string, packageItems: PackageItem[]): {
  buildingId: string
  clonedNodes: number
  lampsPlaced: number
} | null {
  const scene = useScene.getState()
  const originalBuilding = scene.nodes[originalBuildingId as AnyNodeId]
  
  if (!originalBuilding || originalBuilding.type !== 'building') {
    console.error('[Room vibe] Original building not found or invalid type')
    return null
  }

  const buildingNode = originalBuilding as BuildingNode
  const siteId = buildingNode.parentId
  if (!siteId) {
    console.error('[Room vibe] Building has no parent site')
    return null
  }

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

  if (Object.keys(clonedGraph.nodes).length === 0) {
    console.error('[Room vibe] cloneSceneGraph returned 0 nodes')
    return null
  }

  const newBuildingId = clonedGraph.rootNodeIds[0]
  const clonedBuildingNode = clonedGraph.nodes[newBuildingId] as BuildingNode

  const offsetBuildingNode = {
    ...clonedBuildingNode,
    id: newBuildingId,
    parentId: siteId,
    position: [originalPosition[0] + offsetX, originalPosition[1], originalPosition[2]] as [number, number, number],
  }

  const idToParentId = new Map<string, string>()
  idToParentId.set(newBuildingId, siteId as string)

  for (const [id, node] of Object.entries(clonedGraph.nodes)) {
    if (id === newBuildingId) continue
    if ('parentId' in node && node.parentId) {
      idToParentId.set(id, node.parentId as string)
    }
  }

  const topoOrdered: { node: any; parentId: AnyNodeId }[] = []
  const added = new Set<string>()

  const addNode = (nodeId: string) => {
    if (added.has(nodeId)) return
    
    const parentId = idToParentId.get(nodeId)
    if (parentId && !added.has(parentId) && idToParentId.has(parentId)) {
      addNode(parentId)
    }

    const node = nodeId === newBuildingId ? offsetBuildingNode : clonedGraph.nodes[nodeId as AnyNodeId]
    if (node && parentId) {
      topoOrdered.push({ node, parentId: parentId as AnyNodeId })
      added.add(nodeId)
    }
  }

  for (const nodeId of Object.keys(clonedGraph.nodes)) {
    addNode(nodeId)
  }

  const firstLevel = Object.values(clonedGraph.nodes)
    .filter((n) => n && n.type === 'level' && (n as LevelNode).parentId === newBuildingId)
    .sort((a, b) => ((a as LevelNode).level || 0) - ((b as LevelNode).level || 0))[0]

  let lampsPlaced = 0

  if (firstLevel) {
    for (const pkgItem of packageItems) {
      const catalogItem = CATALOG_ITEMS.find((item) => item.id === pkgItem.catalogId)
      if (!catalogItem) {
        console.warn(`[Room vibe] Catalog item not found: ${pkgItem.catalogId}`)
        continue
      }

      try {
        const lampNode = ItemNode.parse({
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
        })

        topoOrdered.push({
          node: lampNode,
          parentId: firstLevel.id as AnyNodeId,
        })
        lampsPlaced++
      } catch (error) {
        console.error(`[Room vibe] Failed to parse item ${pkgItem.catalogId}:`, error)
      }
    }
  } else {
    console.warn('[Room vibe] No level found in cloned building for lamp placement')
  }

  if (topoOrdered.length === 0) {
    console.error('[Room vibe] No nodes to create after topo sort')
    return null
  }

  try {
    scene.createNodes(topoOrdered)
  } catch (error) {
    console.error('[Room vibe] Failed to create nodes via store API:', error)
    return null
  }

  const sceneAfterWrite = useScene.getState()
  if (!sceneAfterWrite.nodes[newBuildingId as AnyNodeId]) {
    console.error('[Room vibe] Version B building not in store after createNodes')
    return null
  }

  console.log('[Room vibe] Version B created with', topoOrdered.length, 'nodes in one write')

  return {
    buildingId: newBuildingId as string,
    clonedNodes: Object.keys(clonedGraph.nodes).length,
    lampsPlaced,
  }
}

export function WebMCPTools() {
  useEffect(() => {
    const abortController = new AbortController()
    let pollTimeout: NodeJS.Timeout | null = null

    const tryRegister = async () => {
      const modelContext = document.modelContext || navigator.modelContext
      if (!modelContext) {
        pollTimeout = setTimeout(tryRegister, 500)
        return
      }

      try {
        await modelContext.registerTool({
          signal: abortController.signal,
          name: 'scene.inspect',
          description:
            'Inspect the current 3D scene: floor plan, zones, furniture items, lights, selection state, and current revision number. Start with this tool to understand what is already in Version A.',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
          annotations: {
            readOnlyHint: true,
          },
          execute: async () => {
            const scene = useScene.getState()
            const nodes = scene.nodes
            const zones = Object.values(nodes).filter((n) => n && n.type === 'zone')
            const items = Object.values(nodes).filter((n) => n && n.type === 'item')
            const walls = Object.values(nodes).filter((n) => n && n.type === 'wall')
            const levels = Object.values(nodes).filter((n) => n && n.type === 'level')
            const revision = useScene.temporal.getState().pastStates.length

            webmcpEvents.emit('inspect-called')

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
              revision,
              totalNodes: Object.keys(nodes).length,
            }
          },
        })

        await modelContext.registerTool({
          signal: abortController.signal,
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
          annotations: {
            readOnlyHint: true,
          },
          execute: async (args: Record<string, unknown>) => {
            const scene = useScene.getState()
            const packageId = args.packageId as string
            const validation = validatePackage(packageId, scene)

            webmcpEvents.emit('inspect-called')

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

        await modelContext.registerTool({
          signal: abortController.signal,
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

            let confirmed: boolean
            try {
              confirmed = await showConfirmationModal(packageId, pkg.name)
            } catch (error) {
              console.error('[Room vibe] Modal failed:', error)
              return { success: false, error: 'Modal timeout or failure - no human response after 60 seconds' }
            }

            if (!confirmed) {
              const revisionBefore = useScene.temporal.getState().pastStates.length
              const refusedReceipt: SceneReceipt = {
                packageId: pkg.id,
                packageName: pkg.name,
                revisionBefore,
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

            const revisionBefore = useScene.temporal.getState().pastStates.length

            const scene = useScene.getState()
            const buildings = Object.values(scene.nodes).filter((n) => n && n.type === 'building')
            const firstBuilding = buildings[0]

            if (!firstBuilding) {
              return { success: false, error: 'No building found in scene' }
            }

            const result = cloneApartmentForVersionB(firstBuilding.id, pkg.items)

            if (!result) {
              return { success: false, error: 'Failed to create Version B - cloning returned null' }
            }

            if (result.clonedNodes === 0) {
              return { success: false, error: 'Failed to create Version B - 0 nodes cloned' }
            }

            if (result.lampsPlaced === 0) {
              console.warn('[Room vibe] Version B created but 0 lamps placed')
            }

            versionBBuildingId = result.buildingId

            const revisionAfter = useScene.temporal.getState().pastStates.length

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
              lampsPlaced: result.lampsPlaced,
              message:
                'Version B created successfully as a complete apartment copy offset in +X with Warm Dusk lighting. Use scene.focus_comparison to view both versions.',
            }
          },
        })

        await modelContext.registerTool({
          signal: abortController.signal,
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

        await modelContext.registerTool({
          signal: abortController.signal,
          name: 'scene.session_state',
          description:
            'Get current session state: who may write, what is stale, and checkout capability. canCheckout is always false.',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
          annotations: {
            readOnlyHint: true,
          },
          execute: async () => {
            const revision = useScene.temporal.getState().pastStates.length
            webmcpEvents.emit('inspect-called')
            return {
              canWrite: true,
              canCheckout: false,
              revision,
              staleState: false,
              message: 'Checkout is permanently disabled for this demo',
            }
          },
        })

        await modelContext.registerTool({
          signal: abortController.signal,
          name: 'scene.read_receipt',
          description:
            'Read the last Scene Receipt if one exists. Returns package info, revisions, timestamp, and confirmation status.',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
          annotations: {
            readOnlyHint: true,
          },
          execute: async () => {
            const currentReceipt = getSceneReceipt()
            webmcpEvents.emit('inspect-called')
            if (!currentReceipt) {
              return { exists: false, message: 'No receipt found' }
            }
            return { exists: true, receipt: currentReceipt }
          },
        })

        console.log('[WebMCP] Registered 6 scene tools on', document.modelContext ? 'document' : 'navigator', '.modelContext')
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('[WebMCP] Failed to register tools:', error)
        }
      }
    }

    tryRegister()

    return () => {
      abortController.abort()
      if (pollTimeout) {
        clearTimeout(pollTimeout)
      }
    }
  }, [])

  return null
}
