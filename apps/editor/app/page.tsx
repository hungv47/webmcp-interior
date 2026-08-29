'use client'

import { useEffect, useState } from 'react'
import { Viewer } from '@aedifex/viewer'
import { useScene } from '@aedifex/core'
import { WebMCPTools } from '@/components/webmcp/webmcp-tools'
import { WebMCPOrchestrator } from '@/components/webmcp/webmcp-orchestrator'

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    async function loadDemoScene() {
      try {
        const response = await fetch('/demos/demo_1.json')
        const sceneData = await response.json()
        
        const scene = useScene.getState()
        scene.unloadScene()
        
        const { nodes, rootNodeIds } = sceneData
        scene.loadScene()
        
        for (const id of rootNodeIds) {
          scene.replaceNode(id, nodes[id])
        }
        
        for (const [id, node] of Object.entries(nodes)) {
          if (!rootNodeIds.includes(id)) {
            scene.replaceNode(id, node)
          }
        }
        
        setIsLoaded(true)
      } catch (error) {
        console.error('[Room vibe] Failed to load demo scene:', error)
        setIsLoaded(true)
      }
    }

    loadDemoScene()
  }, [])

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
        <p className="mt-1 text-xs text-white/40">AI-guided interior</p>
      </div>

      <Viewer projectId="room-vibe-demo" />

      <WebMCPTools />
      <WebMCPOrchestrator />
    </div>
  )
}
