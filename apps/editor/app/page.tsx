'use client'

import { useEffect, useLayoutEffect, useState } from 'react'
import { Viewer, useViewer } from '@aedifex/viewer'
import { useScene, clearSceneHistory, ItemNode, emitter, type AnyNodeId } from '@aedifex/core'
import { Undo2 } from 'lucide-react'
import { WebMCPTools } from '@/components/webmcp/webmcp-tools'
import { WebMCPOrchestrator } from '@/components/webmcp/webmcp-orchestrator'
import { FirstVisitCard, HowItWorksButton } from '@/components/webmcp/first-visit-card'
import { NextStepDock } from '@/components/webmcp/next-step-dock'
import { FrameRoomCamera } from '@/components/webmcp/frame-room-camera'
import { PACKAGES } from '@/lib/packages'
import { CATALOG_ITEMS } from '@aedifex/editor'

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [canUndo, setCanUndo] = useState(false)

  useLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('viewer-preferences')
    }
  }, [])

  useEffect(() => {
    const viewer = useViewer.getState()
    
    viewer.setSceneTheme('sunset')
    viewer.setRenderContext('viewer')
    viewer.setLevelMode('stacked')
    viewer.setShowZones(false)
    viewer.setShowGuides(false)
    
    const checkAndReapply = () => {
      const current = useViewer.getState()
      if (current.renderContext !== 'viewer' || current.levelMode !== 'stacked' || 
          current.showZones !== false || current.showGuides !== false) {
        console.log('[Room vibe] Persist rehydrated, reapplying consumer settings')
        current.setRenderContext('viewer')
        current.setLevelMode('stacked')
        current.setShowZones(false)
        current.setShowGuides(false)
      }
    }
    
    const timers = [
      setTimeout(checkAndReapply, 50),
      setTimeout(checkAndReapply, 100),
      setTimeout(checkAndReapply, 200),
    ]
    
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    async function loadDemoScene() {
      try {
        const response = await fetch('/demos/demo_1.json')
        const sceneData = await response.json()
        
        if (!sceneData.nodes || !sceneData.rootNodeIds) {
          console.error('[Room vibe] Invalid scene data')
          setIsLoaded(true)
          return
        }

        const scene = useScene.getState()
        scene.setScene(sceneData.nodes, sceneData.rootNodeIds, {
          collections: sceneData.collections,
          materials: sceneData.materials,
          installedPlugins: sceneData.installedPlugins,
        })

        const firstBuilding = Object.values(scene.nodes).find((n) => n && n.type === 'building')
        if (firstBuilding) {
          const groundLevel = Object.values(scene.nodes).find(
            (n) => n && n.type === 'level' && (n as any).level === 0
          )

          if (groundLevel) {
            const furniturePackage = PACKAGES.pkg_lived_in_01
            const nodesToCreate: { node: any; parentId: AnyNodeId }[] = []

            for (const pkgItem of furniturePackage.items) {
              const catalogItem = CATALOG_ITEMS.find((item) => item.id === pkgItem.catalogId)
              if (!catalogItem) {
                console.warn(`[Room vibe] Catalog item not found: ${pkgItem.catalogId}`)
                continue
              }

              try {
                const itemNode = ItemNode.parse({
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

                nodesToCreate.push({
                  node: itemNode,
                  parentId: groundLevel.id as AnyNodeId,
                })
              } catch (error) {
                console.error(`[Room vibe] Failed to parse item ${pkgItem.catalogId}:`, error)
              }
            }

            if (nodesToCreate.length > 0) {
              scene.createNodes(nodesToCreate)
              console.log(`[Room vibe] Seeded Version A with ${nodesToCreate.length} furniture items`)
            }
          }
        }

        clearSceneHistory()

        const groundLevel = Object.values(scene.nodes).find(
          (n) => n && n.type === 'level' && (n as any).level === 0
        )
        if (groundLevel) {
          setTimeout(() => {
            emitter.emit('camera-controls:view', { nodeId: groundLevel.id })
          }, 100)
        }

        setIsLoaded(true)
        console.log('[Room vibe] Demo scene loaded:', Object.keys(sceneData.nodes).length, 'nodes')
      } catch (error) {
        console.error('[Room vibe] Failed to load demo scene:', error)
        const scene = useScene.getState()
        scene.loadScene()
        setIsLoaded(true)
      }
    }

    loadDemoScene()
    
    const interval = setInterval(() => {
      const temporalState = useScene.temporal?.getState()
      if (temporalState) {
        setCanUndo((temporalState.pastStates?.length ?? 0) > 0)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const handleUndo = () => {
    const temporalState = useScene.temporal?.getState()
    if (temporalState && temporalState.undo) {
      temporalState.undo()
      console.log('[Room vibe] Undo executed')
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950">
        <div className="text-sm text-zinc-400">Loading room...</div>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className="pointer-events-none absolute top-6 left-6 z-50 flex items-center gap-3">
        <h1 className="text-lg font-light tracking-wide text-white/90">Room vibe</h1>
        <HowItWorksButton />
      </div>

      <div className="pointer-events-auto absolute top-6 right-6 z-50">
        <button
          className={`flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm backdrop-blur transition-colors ${
            canUndo
              ? 'text-white/70 hover:bg-white/10 hover:text-white/90'
              : 'cursor-not-allowed text-white/30'
          }`}
          disabled={!canUndo}
          onClick={handleUndo}
          title="Undo (Ctrl+Z)"
          type="button"
        >
          <Undo2 className="h-4 w-4" />
          <span className="font-medium">Undo</span>
        </button>
      </div>

      <div className="pointer-events-none absolute top-6 right-6 left-6 z-30 flex justify-center">
        <a 
          href="https://github.com/TangSY/aedifex" 
          target="_blank" 
          rel="noopener noreferrer"
          className="pointer-events-auto rounded-full border border-white/5 bg-black/20 px-3 py-1 text-xs text-white/30 backdrop-blur transition-colors hover:bg-black/30 hover:text-white/50"
        >
          Built on Aedifex (MIT)
        </a>
      </div>

      <Viewer renderContext="viewer" defaultRender={false}>
        <FrameRoomCamera />
      </Viewer>

      <WebMCPTools />
      <WebMCPOrchestrator />
      <FirstVisitCard />
      <NextStepDock />
    </div>
  )
}
