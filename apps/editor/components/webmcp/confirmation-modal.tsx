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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[90vw] max-w-md rounded-lg border border-border bg-background p-6 shadow-2xl">
        <h2 className="mb-2 text-xl font-semibold">Confirm Package Application</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          The agent proposes to apply <strong>{packageName}</strong> ({packageId}) as Version B.
        </p>
        <p className="mb-6 text-sm text-muted-foreground">
          Version A will remain untouched. Version B will appear as a sibling building offset in +X. You can
          undo this change with one native Undo.
        </p>
        <div className="flex gap-3">
          <button
            className="flex-1 rounded border border-red-500/60 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/20"
            onClick={() => {
              setIsVisible(false)
              onRefuse()
            }}
            type="button"
          >
            Refuse
          </button>
          <button
            className="flex-1 rounded border border-green-500/60 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-600 transition-colors hover:bg-green-500/20"
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

export function showConfirmationModal(packageId: string, packageName: string): Promise<boolean> {
  return new Promise((resolve) => {
    modalResolver = resolve
    const event = new CustomEvent('webmcp:show-modal', {
      detail: { packageId, packageName },
    })
    window.dispatchEvent(event)
  })
}

export function resolveModal(confirmed: boolean) {
  if (modalResolver) {
    modalResolver(confirmed)
    modalResolver = null
  }
}
