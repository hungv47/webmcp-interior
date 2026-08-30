'use client'

import { useEffect, useState } from 'react'
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
        return 'Waiting for ChatGPT to inspect the 1-bed.'
      case 'apply':
        return 'Ask ChatGPT to apply Warm Dusk, then confirm here.'
      case 'confirm':
        return 'Confirm on this page. ChatGPT cannot restyle until you do.'
      case 'done':
        return 'Version B is next door. Your Scene Receipt stays.'
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-6 left-6 z-40">
      <div className="rounded-lg border border-white/10 bg-black/40 px-4 py-2 backdrop-blur">
        <p className="text-sm text-white/70">{getMessage()}</p>
      </div>
    </div>
  )
}
