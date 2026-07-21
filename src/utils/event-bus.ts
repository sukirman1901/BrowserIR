type EventHandler = (data: any) => void | Promise<void>

export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>()
  
  on(event: string, handler: EventHandler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(handler)
  }
  
  off(event: string, handler: EventHandler) {
    this.handlers.get(event)?.delete(handler)
  }
  
  async emit(event: string, data?: any) {
    const handlers = this.handlers.get(event)
    if (handlers) {
      for (const handler of handlers) await handler(data)
    }
  }
}
