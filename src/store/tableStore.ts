import { create } from "zustand";
import { Table } from "@/types";
import { API_URL } from "@/constants/config";
import { DEFAULT_TABLES } from "@/constants/mockData";
import { apiFetch } from "@/utils/api";

interface TableStore {
  tables: Table[];
  fetchTables: () => Promise<void>;
  setTableStatus: (id: number, status: Table["status"]) => Promise<void>;
  setTableOrder: (id: number, orderId: string) => Promise<void>;
  clearTable: (id: number) => Promise<void>;
}

export const useTableStore = create<TableStore>((set) => ({
  tables: DEFAULT_TABLES,
  fetchTables: async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/tables`);
      if (res.ok) {
        const data = await res.json();
        set({ tables: data });
      }
    } catch (err) {
      console.error("Failed to fetch tables:", err);
    }
  },
  setTableStatus: async (id, status) => {
    try {
      const res = await apiFetch(`${API_URL}/api/tables/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        set((state) => ({
          tables: state.tables.map((table) => (table.id === id ? data : table)),
        }));
      }
    } catch (err) {
      console.error("Failed to set table status:", err);
    }
  },
  setTableOrder: async (id, orderId) => {
    // Creating an order on the backend already updates the table, but we keep local state in sync:
    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === id ? { ...table, currentOrderId: orderId, status: "active" } : table
      ),
    }));
  },
  clearTable: async (id) => {
    try {
      const res = await apiFetch(`${API_URL}/api/tables/${id}/clear`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        set((state) => ({
          tables: state.tables.map((table) => (table.id === id ? data : table)),
        }));
      }
    } catch (err) {
      console.error("Failed to clear table:", err);
    }
  },
}));

