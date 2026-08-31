'use client'

import { useEffect, useState } from 'react'
import { Copy, Check, Sparkles } from 'lucide-react'
import { useScene } from '@aedifex/core'

const CHATGPT_PROMPT = `This is Room vibe. Do not click the view. Do not checkout.

1. Inspect the apartment. Tell me the zones and furniture.
2. Validate pkg_warm_dusk_01, then apply it.
3. Wait for me to Confirm or Refuse on the page.`

export function NextStepDock() {
  const [copied, setCopied] = useState(false)
  const [hasModelContext, setHasModelContext] = useState(false)
  const [hasReceipt, setHasReceipt] = useState(false)
  const [buildingCount, setBuildingCount] = useState(1)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const showDock = () => setIsVisible(true)
    window.addEventListener('room-vibe:open-how-it-works', showDock)

    const checkModelContext = () => {
      const context = document.modelContext || navigator.modelContext
      setHasModelContext(!!context)
    }

    const checkReceipt = () => {
      const receiptEvent = (window as any).__webmcp_receipt_exists
      setHasReceipt(!!receiptEvent)
    }

    const checkBuildings = () => {
      const scene = useScene.getState()
      const buildings = Object.values(scene.nodes).filter((n) => n && n.type === 'building')
      setBuildingCount(buildings.length)
    }

    const handleReceiptCreated = () => {
      setHasReceipt(true)
      setIsVisible(true)
    }

    checkModelContext()
    checkReceipt()
    checkBuildings()
    
    const interval = setInterval(() => {
      checkModelContext()
      checkReceipt()
      checkBuildings()
    }, 1000)

    window.addEventListener('webmcp:receipt-created', handleReceiptCreated)

    return () => {
      clearInterval(interval)
      window.removeEventListener('room-vibe:open-how-it-works', showDock)
      window.removeEventListener('webmcp:receipt-created', handleReceiptCreated)
    }
  }, [])

  if (!isVisible) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CHATGPT_PROMPT)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('[Room vibe] Failed to copy prompt:', error)
    }
  }

  const step3Text = hasReceipt && buildingCount < 2
    ? 'Version B is gone. Your Scene Receipt stays.'
    : buildingCount >= 2
      ? 'Walk both rooms. Undo (top right) drops Version B. Your Scene Receipt stays.'
      : 'Version A stays unchanged. Version B appears next door. Undo is top right.'

  const positionClass = hasReceipt 
    ? 'fixed right-6 bottom-6 z-40 max-w-md'
    : 'fixed right-6 bottom-6 left-6 z-40 max-w-2xl'

  return (
    <div className={`pointer-events-auto ${positionClass}`}>
      <div className="rounded-2xl border border-white/20 bg-gradient-to-b from-black/80 to-black/90 px-5 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="flex flex-col gap-3.5 text-[15px]">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white/60">
              1
            </span>
            <p className="flex-1 text-white/80">
              Open this URL in <span className="font-medium text-white">ChatGPT in-app browser</span>{' '}
              (Sol or Terra model)
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white/60">
              2
            </span>
            <div className="flex flex-1 flex-col gap-2">
              <p className="text-white/80">
                Paste the prompt below. ChatGPT will register six site tools.
              </p>
              <div className="rounded-xl border border-white/10 bg-black/60 p-3.5 backdrop-blur-sm">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-white/50">Starter prompt</p>
                  <button
                    className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white/70 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
                    onClick={handleCopy}
                    type="button"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-white/70">{CHATGPT_PROMPT}</pre>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white/60">
              3
            </span>
            <p className="flex-1 text-white/80">
              <span className="font-medium text-white">Confirm or Refuse</span> when the modal appears.
              {' '}{step3Text}
            </p>
          </div>

          {!hasModelContext && (
            <div className="mt-1 flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 backdrop-blur-sm">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/80" />
              <div>
                <p className="text-sm font-medium text-amber-200/90">Waiting for ChatGPT</p>
                <p className="mt-1 text-xs leading-relaxed text-amber-200/70">
                  Open this page in ChatGPT's browser to register site tools. For local testing,
                  enable chrome://flags/#enable-webmcp-testing.
                </p>
              </div>
            </div>
          )}

          {hasModelContext && (
            <div className="mt-1 flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 backdrop-blur-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-emerald-200/90">6 tools registered</p>
                <p className="mt-1 text-xs leading-relaxed text-emerald-200/70">
                  ChatGPT can now inspect and restyle this apartment. Everything happens through ChatGPT.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
