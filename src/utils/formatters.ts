export function formatCurrency(value: number, currency = "₹") {
  return `${currency}${value.toLocaleString("en-IN")}`;
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function getTableName(id: number, settings?: { restaurantTableCount?: number; familyTableCount?: number }): string {
  const rCount = settings?.restaurantTableCount ?? 6;
  const fCount = settings?.familyTableCount ?? 4;
  if (id >= 1 && id <= rCount) return `R${id}`;
  if (id >= rCount + 1 && id <= rCount + fCount) return `F${id - rCount}`;
  return `T${id - rCount - fCount}`;
}
