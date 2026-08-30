'use client'

import { useEffect, useState } from 'react'
import { Copy, Check } from 'lucide-react'

const CHATGPT_PROMPT = `This is Room vibe. Do not click the view. Do not checkout.

1. Inspect the apartment. Tell me the zones and furniture.
2. Validate pkg_warm_dusk_01, then apply it.
3. Wait for me to Confirm or Refuse on the page.`

export function NextStepDock() {
  const [copied, setCopied] = useState(false)
  const [hasModelContext, setHasModelContext] = useState(false)

  useEffect(() => {
    const checkModelContext = () => {
      const context = document.modelContext || navigator.modelContext
      setHasModelContext(!!context)
    }

    checkModelContext()
    const interval = setInterval(checkModelContext, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CHATGPT_PROMPT)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('[Room vibe] Failed to copy prompt:', error)
    }
  }

  return (
    <div className="pointer-events-auto fixed right-6 bottom-6 left-6 z-40 max-w-2xl">
      <div className="rounded-lg border border-white/10 bg-black/60 px-4 py-3 backdrop-blur">
        <div className="flex flex-col gap-2 text-sm text-white/70">
          <div className="flex items-start gap-3">
            <span className="text-white/40">1.</span>
            <p className="flex-1">
              Open this same URL in <span className="font-medium text-white/90">ChatGPT in-app browser</span>{' '}
              (Sol or Terra model). Luna has WebMCP off.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-white/40">2.</span>
            <div className="flex flex-1 items-center justify-between gap-3">
              <p className="flex-1">
                Copy and paste the prompt below. ChatGPT will see six site tools.
              </p>
              <button
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-white/50 hover:bg-white/10 hover:text-white/90"
                onClick={handleCopy}
                type="button"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy prompt'}
              </button>
            </div>
          </div>

          <div className="ml-6 rounded border border-white/10 bg-black/40 px-3 py-2">
            <pre className="whitespace-pre-wrap text-xs leading-relaxed text-white/60">{CHATGPT_PROMPT}</pre>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-white/40">3.</span>
            <p className="flex-1">
              <span className="font-medium text-white/90">Confirm or Refuse on this page</span> when the modal appears.
              Version A stays unchanged. Version B appears next door. Undo is top right.
            </p>
          </div>

          {!hasModelContext && (
            <div className="mt-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2">
              <p className="text-xs text-yellow-200/80">
                <span className="font-medium">Waiting for ChatGPT.</span> This page needs to be opened inside
                ChatGPT's in-app browser to register site tools. For local testing in Chrome, enable
                chrome://flags/#enable-webmcp-testing.
              </p>
            </div>
          )}

          {hasModelContext && (
            <div className="mt-2 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2">
              <p className="text-xs text-green-200/80">
                <span className="font-medium">6 site tools registered.</span> ChatGPT can now inspect and
                restyle this apartment. No in-page chat here — everything happens through ChatGPT.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
