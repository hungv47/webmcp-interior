'use client'

import { useEffect, useState } from 'react'

interface ConfirmationModalProps {
  packageId: string
  packageName: string
  onConfirm: () => void
  onRefuse: () => void
}

export function ConfirmationModal({ packageId, packageName, onConfirm, onRefuse }: ConfirmationModalProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[90vw] max-w-md rounded-xl border border-white/10 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur">
        <div className="mb-4">
          <h2 className="text-xl font-medium text-white">Apply {packageName}?</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            Your AI agent proposes to apply the <strong className="font-medium text-white">{packageName}</strong> lighting package.
          </p>
        </div>
        
        <div className="mb-6 space-y-2 rounded-lg border border-white/5 bg-white/5 p-4 text-sm text-white/50">
          <p>✓ Version A stays untouched</p>
          <p>✓ Version B appears as a sibling apartment</p>
          <p>✓ You can undo this change</p>
        </div>

        <div className="flex gap-3">
          <button
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
            onClick={() => {
              setIsVisible(false)
              onRefuse()
            }}
            type="button"
          >
            Refuse
          </button>
          <button
            className="flex-1 rounded-lg border border-green-500/60 bg-green-500/20 px-4 py-2.5 text-sm font-medium text-green-400 transition-colors hover:bg-green-500/30"
            onClick={() => {
              setIsVisible(false)
              onConfirm()
            }}
            type="button"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

let modalResolver: ((confirmed: boolean) => void) | null = null
let modalTimeout: NodeJS.Timeout | null = null

export function showConfirmationModal(packageId: string, packageName: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (modalTimeout) {
      clearTimeout(modalTimeout)
    }

    modalResolver = resolve

    modalTimeout = setTimeout(() => {
      if (modalResolver) {
        console.error('[Room vibe] Modal timeout - no response after 60s')
        modalResolver(false)
        modalResolver = null
      }
    }, 60000)

    const event = new CustomEvent('webmcp:show-modal', {
      detail: { packageId, packageName },
    })
    window.dispatchEvent(event)
  })
}

export function resolveModal(confirmed: boolean) {
  if (modalTimeout) {
    clearTimeout(modalTimeout)
    modalTimeout = null
  }

  if (modalResolver) {
    modalResolver(confirmed)
    modalResolver = null
  }
}
