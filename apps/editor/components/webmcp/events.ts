type WebMCPEvent = 'inspect-called' | 'modal-open' | 'modal-closed'

type EventListener = () => void

class WebMCPEventBus {
  private listeners: Map<WebMCPEvent, Set<EventListener>> = new Map()

  on(event: WebMCPEvent, listener: EventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener)
  }

  off(event: WebMCPEvent, listener: EventListener) {
    this.listeners.get(event)?.delete(listener)
  }

  emit(event: WebMCPEvent) {
    this.listeners.get(event)?.forEach((listener) => listener())
  }
}

export const webmcpEvents = new WebMCPEventBus()
