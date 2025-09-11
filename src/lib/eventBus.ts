/**
 * Ultra-light event bus.
 * Copy to: src/lib/eventBus.ts
 */
type Handler<T=any> = (payload: T) => void;

class EventBus {
  private map = new Map<string, Set<Handler>>();
  on<T=any>(event: string, handler: Handler<T>) {
    if (!this.map.has(event)) this.map.set(event, new Set());
    this.map.get(event)!.add(handler as Handler);
  }
  off<T=any>(event: string, handler: Handler<T>) {
    this.map.get(event)?.delete(handler as Handler);
  }
  emit<T=any>(event: string, payload: T) {
    this.map.get(event)?.forEach(h => h(payload));
  }
}

export const eventBus = new EventBus();

// Events we will use:
// 'paragraph.ready' -> payload: { paragraph: string, index: number }
// 'coach.message'   -> payload: FeedbackMsg
