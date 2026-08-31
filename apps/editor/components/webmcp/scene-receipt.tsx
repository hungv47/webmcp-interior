'use client'

import { useState } from 'react'
import { Minimize2, Copy, Check, FileCheck } from 'lucide-react'

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

  const statusConfig =
    receipt.confirmedBy === 'human'
      ? { 
          border: 'border-emerald-500/30', 
          bg: 'bg-emerald-500/15', 
          text: 'text-emerald-400',
          label: 'Confirmed'
        }
      : receipt.confirmedBy === 'refused'
        ? { 
            border: 'border-red-500/30', 
            bg: 'bg-red-500/15', 
            text: 'text-red-400',
            label: 'Refused'
          }
        : { 
            border: 'border-amber-500/30', 
            bg: 'bg-amber-500/15', 
            text: 'text-amber-400',
            label: 'Blocked'
          }

  const handleCopy = async () => {
    const text = `Scene Receipt - ${receipt.packageName}
Package: ${receipt.packageId}
Status: ${statusConfig.label}
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
      <div className="pointer-events-auto fixed bottom-6 left-6 z-50 rounded-xl border border-white/20 bg-gradient-to-b from-zinc-900/98 to-zinc-950/98 px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <button
          className="flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
          onClick={() => setIsCollapsed(false)}
          type="button"
        >
          <FileCheck className="h-3.5 w-3.5" />
          <span className="font-medium">Scene Receipt</span>
        </button>
      </div>
    )
  }

  return (
    <div className="pointer-events-auto fixed bottom-6 left-6 z-50 w-80 rounded-2xl border border-white/20 bg-gradient-to-b from-zinc-900/98 to-zinc-950/98 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-white/60" />
            <h3 className="text-sm font-medium text-white">Scene Receipt</h3>
          </div>
          <p className="mt-1 text-xs text-white/50">Package application record</p>
        </div>
        <div className="flex gap-1">
          <button
            className="rounded-lg p-1.5 text-white/50 transition-all hover:bg-white/10 hover:text-white/80"
            onClick={handleCopy}
            title="Copy receipt"
            type="button"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            className="rounded-lg p-1.5 text-white/50 transition-all hover:bg-white/10 hover:text-white/80"
            onClick={handleCollapse}
            title="Collapse"
            type="button"
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-3 text-[15px]">
        <div>
          <span className="text-white/50">Package</span>
          <div className="mt-1">
            <span className="font-medium text-white">{receipt.packageName}</span>
            <span className="ml-1.5 text-xs text-white/40">({receipt.packageId})</span>
          </div>
        </div>

        <div>
          <span className="text-white/50">Revision</span>
          <div className="mt-1">
            <span className="font-mono text-sm text-white/80">
              {receipt.revisionBefore} → {receipt.revisionAfter ?? 'N/A'}
            </span>
          </div>
        </div>

        <div>
          <span className="text-white/50">Time</span>
          <div className="mt-1">
            <span className="text-sm text-white/70">
              {new Date(receipt.timestamp).toLocaleString()}
            </span>
          </div>
        </div>

        <div>
          <span className="text-white/50">Tools</span>
          <div className="mt-1">
            <span className="text-sm text-white/70">{receipt.toolsUsed.join(', ')}</span>
          </div>
        </div>

        <div className={`mt-4 rounded-xl border ${statusConfig.border} ${statusConfig.bg} px-3 py-2 text-center backdrop-blur-sm`}>
          <span className={`text-sm font-medium ${statusConfig.text}`}>
            {statusConfig.label}
          </span>
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
