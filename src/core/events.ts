/**
 * Event System - Systeme d'evenements type-safe et performant
 */

type EventHandler<T = any> = (data: T) => void | Promise<void>
type EventMap = Record<string, any>

export class EventBus<TEvents extends EventMap = EventMap> {
  private handlers = new Map<keyof TEvents, Set<EventHandler<any>>>()
  private onceHandlers = new Map<keyof TEvents, Set<EventHandler<any>>>()

  static create<TEvents extends EventMap>(): EventBus<TEvents> {
    return new EventBus<TEvents>()
  }

  on<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>
  ): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    
    this.handlers.get(event)!.add(handler)
    
    // Retourne une fonction de cleanup
    return () => this.off(event, handler)
  }

  once<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>
  ): () => void {
    if (!this.onceHandlers.has(event)) {
      this.onceHandlers.set(event, new Set())
    }
    
    this.onceHandlers.get(event)!.add(handler)
    
    return () => {
      const handlers = this.onceHandlers.get(event)
      if (handlers) {
        handlers.delete(handler)
      }
    }
  }

  off<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>
  ): void {
    const handlers = this.handlers.get(event)
    if (handlers) {
      handlers.delete(handler)
    }

    const onceHandlers = this.onceHandlers.get(event)
    if (onceHandlers) {
      onceHandlers.delete(handler)
    }
  }

  async emit<K extends keyof TEvents>(
    event: K,
    data: TEvents[K]
  ): Promise<void> {
    const promises: Promise<void>[] = []

    // Executre les handlers permanents
    const handlers = this.handlers.get(event)
    if (handlers) {
      for (const handler of handlers) {
        try {
          const result = handler(data)
          if (result instanceof Promise) {
            promises.push(result)
          }
        } catch (error) {
          // Log en mode silencieux pour eviter de casser le flow
          console.error(`Event handler error for ${String(event)}:`, error)
        }
      }
    }

    // Executer les handlers one-time
    const onceHandlers = this.onceHandlers.get(event)
    if (onceHandlers) {
      const handlersToExecute = Array.from(onceHandlers)
      onceHandlers.clear()
      
      for (const handler of handlersToExecute) {
        try {
          const result = handler(data)
          if (result instanceof Promise) {
            promises.push(result)
          }
        } catch (error) {
          console.error(`Once event handler error for ${String(event)}:`, error)
        }
      }
    }

    // Attendre tous les handlers async
    if (promises.length > 0) {
      await Promise.allSettled(promises)
    }
  }

  clear(): void {
    this.handlers.clear()
    this.onceHandlers.clear()
  }

  getHandlerCount<K extends keyof TEvents>(event: K): number {
    const regular = this.handlers.get(event)?.size || 0
    const once = this.onceHandlers.get(event)?.size || 0
    return regular + once
  }
}

// Type helper pour definir des events
export type CreateEventMap<T> = T

// Instance globale optionnelle
export const globalEventBus = EventBus.create()