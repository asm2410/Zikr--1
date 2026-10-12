import type { Zikr, CustomOrder } from '../types';

export function getCategoryCustomOrder(customOrder: CustomOrder | undefined, categoryId: number): number[] | undefined {
  if (!customOrder) return undefined;
  const raw = customOrder[categoryId] ?? (customOrder as Record<string, number[]>)[String(categoryId)];
  if (!raw || !Array.isArray(raw) || raw.length === 0) return undefined;
  return raw.map(Number);
}

export function applyCustomOrder(items: Zikr[], order: number[] | undefined): Zikr[] {
  if (!order || order.length === 0) return items;
  const byId = new Map(items.map((z) => [Number(z.id), z]));
  const ordered: Zikr[] = [];
  const used = new Set<number>();
  for (const rawId of order) {
    const id = Number(rawId);
    const z = byId.get(id);
    if (z) {
      ordered.push(z);
      used.add(id);
    }
  }
  for (const z of items) {
    if (!used.has(Number(z.id))) ordered.push(z);
  }
  return ordered;
}

export function getDefaultOrderIds(items: Zikr[]): number[] {
  return [...items].sort((a, b) => a.orderIndex - b.orderIndex).map((z) => Number(z.id));
}

export function getOrderedCategoryItems(
  items: Zikr[],
  categoryId: number,
  customOrder: CustomOrder,
): Zikr[] {
  const raw = items
    .filter((z) => Number(z.categoryId) === Number(categoryId))
    .sort((a, b) => a.orderIndex - b.orderIndex);
  return applyCustomOrder(raw, getCategoryCustomOrder(customOrder, categoryId));
}
