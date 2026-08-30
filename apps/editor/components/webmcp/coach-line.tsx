'use client'

import { useEffect, useState } from 'react'
import { useScene } from '@aedifex/core'
import { webmcpEvents } from './events'
import { getSceneReceipt } from './scene-receipt'

export function CoachLine() {
  const [status, setStatus] = useState<'waiting' | 'apply' | 'confirm' | 'done'>('waiting')

  useEffect(() => {
    const handleInspectCalled = () => {
      setStatus((current) => {
        const receipt = getSceneReceipt()
        if (receipt) return 'done'
        if (current === 'done') return 'done'
        return 'apply'
      })
    }

    const handleModalOpen = () => {
      setStatus('confirm')
    }

    const handleModalClosed = () => {
      setStatus((current) => {
        const receipt = getSceneReceipt()
        if (receipt) return 'done'
        if (current === 'confirm') return 'apply'
        return current
      })
    }

    const checkReceipt = () => {
      setStatus((current) => {
        const receipt = getSceneReceipt()
        if (receipt) return 'done'
        return current
      })
    }

    webmcpEvents.on('inspect-called', handleInspectCalled)
    webmcpEvents.on('modal-open', handleModalOpen)
    webmcpEvents.on('modal-closed', handleModalClosed)

    const interval = setInterval(checkReceipt, 1000)

    return () => {
      webmcpEvents.off('inspect-called', handleInspectCalled)
      webmcpEvents.off('modal-open', handleModalOpen)
      webmcpEvents.off('modal-closed', handleModalClosed)
      clearInterval(interval)
    }
  }, [])

  const getMessage = () => {
    switch (status) {
      case 'waiting':
        return 'No furniture buttons on this page. Open How it works, then open this URL in ChatGPT so it can inspect the 1-bed.'
      case 'apply':
        return 'Ask ChatGPT to apply a package (Warm Dusk or Lived-in Interior). A confirm dialog will appear here.'
      case 'confirm':
        return 'Confirm or Refuse on this page. ChatGPT cannot restyle until you do.'
      case 'done': {
        const receipt = getSceneReceipt()
        if (receipt?.confirmedBy === 'refused') {
          return 'You refused. Version A is unchanged. The Scene Receipt stays.'
        }

        const scene = useScene.getState()
        const buildings = Object.values(scene.nodes).filter((n) => n && n.type === 'building')
        const versionBExists = buildings.length >= 2

        if (versionBExists) {
          return 'Walk both rooms. Undo (top right) drops Version B. Your Scene Receipt stays.'
        } else {
          return 'Version B is gone. Your Scene Receipt stays.'
        }
      }
    }
  }

  return (
    <div className="pointer-events-none fixed right-6 bottom-6 left-6 z-40 max-w-lg">
      <div className="rounded-lg border border-white/10 bg-black/55 px-4 py-2.5 backdrop-blur">
        <p className="text-sm leading-relaxed text-white/80">{getMessage()}</p>
      </div>
    </div>
  )
}
