import { create } from "zustand";

// In-memory event store for table-level events (clear reasons, KOT item removal reasons)
// These are session-only notifications that appear in the Live Queue.

export type QueueEventType = "table_cleared" | "kot_item_removed";

export interface QueueEvent {
  id: string;
  type: QueueEventType;
  tableName: string;
  tableId: number;
  reason: string;
  detail?: string; // e.g. item name for kot_item_removed
  createdAt: string;
}

interface EventStore {
  events: QueueEvent[];
  addEvent: (event: Omit<QueueEvent, "id" | "createdAt">) => void;
  clearEvent: (id: string) => void;
  clearAllEvents: () => void;
}

export const useEventStore = create<EventStore>((set) => ({
  events: [],
  addEvent: (event) => {
    const newEvent: QueueEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ events: [newEvent, ...state.events] }));
  },
  clearEvent: (id) => {
    set((state) => ({ events: state.events.filter((e) => e.id !== id) }));
  },
  clearAllEvents: () => {
    set({ events: [] });
  },
}));
