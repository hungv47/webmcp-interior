'use client'

import { useEffect, useState } from 'react'
import { ConfirmationModal, resolveModal } from './confirmation-modal'
import { SceneReceiptCard, type SceneReceipt } from './scene-receipt'

export function WebMCPOrchestrator() {
  const [modalState, setModalState] = useState<{ packageId: string; packageName: string } | null>(null)
  const [receipt, setReceipt] = useState<SceneReceipt | null>(null)

  useEffect(() => {
    const handleShowModal = (event: Event) => {
      const customEvent = event as CustomEvent<{ packageId: string; packageName: string }>
      setModalState(customEvent.detail)
    }

    const handleReceiptCreated = (event: Event) => {
      const customEvent = event as CustomEvent<SceneReceipt>
      setReceipt(customEvent.detail)
    }

    window.addEventListener('webmcp:show-modal', handleShowModal as EventListener)
    window.addEventListener('webmcp:receipt-created', handleReceiptCreated as EventListener)

    return () => {
      window.removeEventListener('webmcp:show-modal', handleShowModal as EventListener)
      window.removeEventListener('webmcp:receipt-created', handleReceiptCreated as EventListener)
    }
  }, [])

  return (
    <>
      {modalState && (
        <ConfirmationModal
          onConfirm={() => {
            resolveModal(true)
            setModalState(null)
          }}
          onRefuse={() => {
            resolveModal(false)
            setModalState(null)
          }}
          packageId={modalState.packageId}
          packageName={modalState.packageName}
        />
      )}
      {receipt && <SceneReceiptCard receipt={receipt} />}
    </>
  )
}
