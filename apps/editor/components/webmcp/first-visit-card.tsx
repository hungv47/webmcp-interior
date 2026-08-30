'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export function FirstVisitCard() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const hasOnboarded = localStorage.getItem('room-vibe-onboarded')
    if (!hasOnboarded) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('room-vibe-onboarded', 'true')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md rounded-xl border border-white/10 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 rounded-lg p-1 text-white/40 transition-colors hover:bg-white/5 hover:text-white/60"
          type="button"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-4">
          <div className="space-y-2 text-white/90">
            <p className="text-base leading-relaxed">You're in a live 1-bed.</p>
            <p className="text-base leading-relaxed">
              Ask ChatGPT to inspect, then apply Warm Dusk. It cannot restyle until you confirm on
              this page.
            </p>
            <p className="text-base leading-relaxed">
              Version B appears next door. The Scene Receipt is what you keep.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleDismiss}
              className="flex-1 rounded-lg bg-white/90 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-white"
              type="button"
            >
              Got it
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white/90"
              type="button"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
