'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export interface SceneReceipt {
  packageId: string
  packageName: string
  revisionBefore: number
  revisionAfter: number | null
  toolsUsed: string[]
  timestamp: string
  agentProposed: boolean
  confirmedBy: 'human' | 'refused' | 'blocked'
}

interface SceneReceiptCardProps {
  receipt: SceneReceipt
  onClose?: () => void
}

export function SceneReceiptCard({ receipt, onClose }: SceneReceiptCardProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  const statusColor =
    receipt.confirmedBy === 'human'
      ? 'border-green-500/60 bg-green-500/10 text-green-600'
      : receipt.confirmedBy === 'refused'
        ? 'border-red-500/60 bg-red-500/10 text-red-600'
        : 'border-yellow-500/60 bg-yellow-500/10 text-yellow-600'

  const statusLabel =
    receipt.confirmedBy === 'human'
      ? 'Confirmed by human'
      : receipt.confirmedBy === 'refused'
        ? 'Refused by human'
        : 'Blocked'

  return (
    <div className="pointer-events-auto fixed bottom-4 left-4 z-50 w-80 rounded-lg border border-border bg-background/95 p-4 shadow-2xl backdrop-blur">
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-base font-semibold">Scene Receipt</h3>
        {onClose && (
          <button
            className="text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => {
              setIsVisible(false)
              onClose()
            }}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="text-muted-foreground">Package:</span>{' '}
          <span className="font-medium">{receipt.packageName}</span>
          <span className="ml-1 text-xs text-muted-foreground">({receipt.packageId})</span>
        </div>

        <div>
          <span className="text-muted-foreground">Revision:</span>{' '}
          <span className="font-mono text-xs">
            {receipt.revisionBefore} → {receipt.revisionAfter ?? 'N/A'}
          </span>
        </div>

        <div>
          <span className="text-muted-foreground">Timestamp:</span>{' '}
          <span className="text-xs">{new Date(receipt.timestamp).toLocaleString()}</span>
        </div>

        <div>
          <span className="text-muted-foreground">Tools used:</span>{' '}
          <span className="text-xs">{receipt.toolsUsed.join(', ')}</span>
        </div>

        <div className={`mt-3 rounded border px-2 py-1 text-center text-xs font-medium ${statusColor}`}>
          {statusLabel}
        </div>
      </div>
    </div>
  )
}

let currentReceipt: SceneReceipt | null = null

export function setSceneReceipt(receipt: SceneReceipt) {
  currentReceipt = receipt
  const event = new CustomEvent('webmcp:receipt-created', { detail: receipt })
  window.dispatchEvent(event)
}

export function getSceneReceipt(): SceneReceipt | null {
  return currentReceipt
}
