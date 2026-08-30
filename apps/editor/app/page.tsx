'use client'

import { useEffect, useState } from 'react'
import { Viewer } from '@aedifex/viewer'
import { useScene, clearSceneHistory } from '@aedifex/core'
import { Undo2 } from 'lucide-react'
import { WebMCPTools } from '@/components/webmcp/webmcp-tools'
import { WebMCPOrchestrator } from '@/components/webmcp/webmcp-orchestrator'
import { FirstVisitCard } from '@/components/webmcp/first-visit-card'
import { CoachLine } from '@/components/webmcp/coach-line'

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [canUndo, setCanUndo] = useState(false)

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

        clearSceneHistory()

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
      <div className="pointer-events-none absolute top-6 left-6 z-50">
        <h1 className="text-lg font-light tracking-wide text-white/90">Room vibe</h1>
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

      <Viewer projectId="room-vibe-demo" />

      <WebMCPTools />
      <WebMCPOrchestrator />
      <FirstVisitCard />
      <CoachLine />
    </div>
  )
}
