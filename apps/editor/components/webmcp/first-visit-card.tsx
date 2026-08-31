'use client'

import { useEffect, useState } from 'react'
import { X, Copy, Check } from 'lucide-react'

const ONBOARD_KEY = 'room-vibe-onboarded-v2'

const CHATGPT_PROMPT = `This page is Room vibe, a live 1-bed. Do not click the 3D view. Do not checkout.

1. Inspect the apartment (Version A). Tell me the zones and what is already there.
2. Validate package pkg_warm_dusk_01, then apply it.
3. Wait for me to Confirm or Refuse on the page.
4. After I confirm, show me Version A, then Version B.`

export function FirstVisitCard() {
  const [isVisible, setIsVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const onOpen = () => setIsVisible(true)
    window.addEventListener('room-vibe:open-how-it-works', onOpen)
    if (!localStorage.getItem(ONBOARD_KEY)) {
      setIsVisible(true)
    }
    return () => window.removeEventListener('room-vibe:open-how-it-works', onOpen)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(ONBOARD_KEY, 'true')
    setIsVisible(false)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CHATGPT_PROMPT)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('[Room vibe] Failed to copy prompt:', error)
    }
  }

  if (!isVisible) return null

  return (
    <div className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="relative mx-4 flex h-[90vh] max-h-[600px] w-full max-w-lg flex-col rounded-2xl border border-white/20 bg-gradient-to-b from-zinc-900/98 to-zinc-950/98 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <button
          aria-label="Close"
          className="absolute top-5 right-5 z-10 rounded-lg p-1.5 text-white/30 transition-all hover:bg-white/10 hover:text-white/70"
          onClick={handleDismiss}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="shrink-0 px-8 pt-8 pb-4">
          <p className="text-xs font-medium tracking-wider text-white/40 uppercase">Room vibe</p>
          <h2 className="mt-2 text-2xl font-light tracking-tight text-white">Restyle with ChatGPT</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/70">
            Walk through a furnished 1-bedroom apartment. Send ChatGPT inside to apply lighting
            packages and see instant before-and-after versions.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-8">
          <div className="space-y-4 text-[15px] text-white/80">
            <div>
              <span className="font-medium text-white">Look around</span>
              <p className="mt-1 text-sm text-white/60">
                Drag to orbit, scroll to zoom. This is Version A.
              </p>
            </div>
            <div>
              <span className="font-medium text-white">Open this URL in ChatGPT</span>
              <p className="mt-1 text-sm text-white/60">
                Use the in-app browser (Sol or Terra). ChatGPT will register six site tools
                automatically.
              </p>
            </div>
            <div>
              <span className="font-medium text-white">Ask for Warm Dusk</span>
              <p className="mt-1 text-sm text-white/60">
                ChatGPT validates and proposes the lighting package. Copy the starter prompt below.
              </p>
            </div>
            <div>
              <span className="font-medium text-white">Confirm on this page</span>
              <p className="mt-1 text-sm text-white/60">
                Version B appears next door. Undo is top right. Your Scene Receipt stays with you.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-black/50 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between">
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
            <pre className="max-h-[120px] overflow-y-auto whitespace-pre-wrap text-[13px] leading-relaxed text-white/80">{CHATGPT_PROMPT}</pre>
          </div>

          <p className="mt-4 pb-4 text-xs leading-relaxed text-white/30">
            Local testing: enable chrome://flags/#enable-webmcp-testing
          </p>
        </div>

        <div className="shrink-0 border-t border-white/10 px-8 py-5">
          <button
            className="w-full rounded-xl bg-white px-4 py-3 text-[15px] font-medium text-zinc-900 shadow-lg transition-all hover:bg-white/95 hover:shadow-xl"
            onClick={handleDismiss}
            type="button"
          >
            Show me the room
          </button>
        </div>
      </div>
    </div>
  )
}

export function HowItWorksButton() {
  return (
    <button
      className="pointer-events-auto rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/70 shadow-lg backdrop-blur-xl transition-all hover:bg-white/20 hover:text-white hover:shadow-xl"
      onClick={() => window.dispatchEvent(new Event('room-vibe:open-how-it-works'))}
      type="button"
    >
      How it works
    </button>
  )
}
