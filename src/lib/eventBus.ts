/**
 * FIXED eventBus.ts - Safe version without ReferenceError issues
 * Replace your src/lib/eventBus.ts with this content
 */

type Handler<T = any> = (payload: T) => void;

class EventBus {
  private map = new Map<string, Set<Handler>>();

  on<T = any>(event: string, handler: Handler<T>) {
    try {
      if (!event || typeof event !== 'string' || !handler) {
        console.warn('EventBus.on: Invalid event or handler');
        return;
      }

      if (!this.map.has(event)) {
        this.map.set(event, new Set());
      }
      
      const handlers = this.map.get(event);
      if (handlers) {
        handlers.add(handler as Handler);
      }
    } catch (error) {
      console.warn('EventBus.on error:', error);
    }
  }

  off<T = any>(event: string, handler: Handler<T>) {
    try {
      if (!event || typeof event !== 'string' || !handler) {
        return;
      }

      const handlers = this.map.get(event);
      if (handlers) {
        handlers.delete(handler as Handler);
      }
    } catch (error) {
      console.warn('EventBus.off error:', error);
    }
  }

  emit<T = any>(event: string, payload: T) {
    try {
      if (!event || typeof event !== 'string') {
        console.warn('EventBus.emit: Invalid event');
        return;
      }

      const handlers = this.map.get(event);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(payload);
          } catch (error) {
            console.warn(`EventBus.emit: Handler error for event '${event}':`, error);
          }
        });
      }
    } catch (error) {
      console.warn('EventBus.emit error:', error);
    }
  }

  clear() {
    try {
      this.map.clear();
    } catch (error) {
      console.warn('EventBus.clear error:', error);
    }
  }
}

export const eventBus = new EventBus();

// Events: 'paragraph.ready' -> { paragraph: string, index: number }