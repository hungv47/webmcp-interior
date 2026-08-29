'use client'

import { useState } from 'react'
import { Minimize2, Copy, Check } from 'lucide-react'

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
  onCollapse?: () => void
}

export function SceneReceiptCard({ receipt, onCollapse }: SceneReceiptCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)

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

  const handleCopy = async () => {
    const text = `Scene Receipt - ${receipt.packageName}
Package: ${receipt.packageId}
Status: ${statusLabel}
Revision: ${receipt.revisionBefore} → ${receipt.revisionAfter ?? 'N/A'}
Time: ${new Date(receipt.timestamp).toLocaleString()}
Tools: ${receipt.toolsUsed.join(', ')}
Agent proposed: Yes`

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleCollapse = () => {
    setIsCollapsed(true)
    if (onCollapse) {
      onCollapse()
    }
  }

  if (isCollapsed) {
    return (
      <div className="pointer-events-auto fixed bottom-4 left-4 z-50 rounded-lg border border-white/10 bg-zinc-900/95 px-3 py-2 shadow-xl backdrop-blur">
        <button
          className="text-xs text-white/60 hover:text-white/90"
          onClick={() => setIsCollapsed(false)}
          type="button"
        >
          Scene Receipt (tap to expand)
        </button>
      </div>
    )
  }

  return (
    <div className="pointer-events-auto fixed bottom-4 left-4 z-50 w-80 rounded-lg border border-white/10 bg-zinc-900/95 p-4 shadow-2xl backdrop-blur">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">Scene Receipt</h3>
          <p className="mt-0.5 text-xs text-white/40">Package application record</p>
        </div>
        <div className="flex gap-1">
          <button
            className="rounded p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
            onClick={handleCopy}
            title="Copy receipt"
            type="button"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            className="rounded p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
            onClick={handleCollapse}
            title="Collapse"
            type="button"
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="text-white/50">Package:</span>{' '}
          <span className="font-medium text-white">{receipt.packageName}</span>
          <span className="ml-1 text-xs text-white/30">({receipt.packageId})</span>
        </div>

        <div>
          <span className="text-white/50">Revision:</span>{' '}
          <span className="font-mono text-xs text-white/70">
            {receipt.revisionBefore} → {receipt.revisionAfter ?? 'N/A'}
          </span>
        </div>

        <div>
          <span className="text-white/50">Time:</span>{' '}
          <span className="text-xs text-white/70">{new Date(receipt.timestamp).toLocaleString()}</span>
        </div>

        <div>
          <span className="text-white/50">Tools:</span>{' '}
          <span className="text-xs text-white/70">{receipt.toolsUsed.join(', ')}</span>
        </div>

        <div className={`mt-3 rounded border px-2 py-1.5 text-center text-xs font-medium ${statusColor}`}>
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
