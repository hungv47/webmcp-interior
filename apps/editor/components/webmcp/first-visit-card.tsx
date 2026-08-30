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
    <div className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur">
        <button
          aria-label="Close"
          className="absolute top-4 right-4 rounded-lg p-1 text-white/40 transition-colors hover:bg-white/5 hover:text-white/60"
          onClick={handleDismiss}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-xs tracking-wide text-white/40 uppercase">Room vibe</p>
        <h2 className="mt-1 text-xl font-medium text-white">A live 1-bed you restyle with ChatGPT</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          This page is the apartment, already furnished. There is no catalog grid here. ChatGPT
          holds the tools and restyles with named packages when it can see this site. You walk the
          room, you confirm, you keep a Scene Receipt.
        </p>

        <div className="mt-5 space-y-3 text-sm text-white/80">
          <p>
            <span className="font-medium text-white">1. Look around.</span> Drag to orbit. Scroll
            to zoom. This is Version A, walls and all.
          </p>
          <p>
            <span className="font-medium text-white">2. Open this same URL in ChatGPT</span> (in-app
            browser, Sol or Terra). Not a screenshot. Not a paste into a chat that cannot see the
            page. You should see Available site tools: inspect, validate, apply, focus, session,
            receipt.
          </p>
          <p>
            <span className="font-medium text-white">3. Ask it to apply Warm Dusk</span> (evening
            lamps). Copy the prompt below if you want.
          </p>
          <p>
            <span className="font-medium text-white">4. Confirm or Refuse on this page.</span>{' '}
            Version A stays. Version B appears next door. Undo is top right. The receipt is what
            you keep. Nobody checkouts.
          </p>
        </div>

        <div className="mt-5 rounded-lg border border-white/10 bg-black/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-white/40">Paste this in ChatGPT on this page</p>
            <button
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-white/50 hover:bg-white/5 hover:text-white/80"
              onClick={handleCopy}
              type="button"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-white/70">{CHATGPT_PROMPT}</pre>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-white/35">
          Localhost will not show site tools inside ChatGPT. That needs a public https URL. In
          Chrome you can turn on chrome://flags/#enable-webmcp-testing to see the tools on this
          tab.
        </p>

        <div className="mt-5 flex gap-3">
          <button
            className="flex-1 rounded-lg bg-white/90 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-white"
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
      className="pointer-events-auto rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 backdrop-blur transition-colors hover:bg-white/10 hover:text-white/90"
      onClick={() => window.dispatchEvent(new Event('room-vibe:open-how-it-works'))}
      type="button"
    >
      How it works
    </button>
  )
}
