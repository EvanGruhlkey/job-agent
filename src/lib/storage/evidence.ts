import type { EvidenceItem, EvidenceSourceType } from "@/lib/types";

import { createId } from "./id";
import { loadStore, saveStore } from "./persist";

export async function listEvidenceItems(): Promise<EvidenceItem[]> {
  const store = await loadStore();
  return store.evidenceItems;
}

export async function listEvidenceBySourceType(
  sourceType: EvidenceSourceType,
): Promise<EvidenceItem[]> {
  const items = await listEvidenceItems();
  return items.filter((item) => item.sourceType === sourceType);
}

export async function getEvidenceItem(
  id: string,
): Promise<EvidenceItem | null> {
  const store = await loadStore();
  return store.evidenceItems.find((e) => e.id === id) ?? null;
}

export async function createEvidenceItem(
  input: Omit<EvidenceItem, "id">,
): Promise<EvidenceItem> {
  const store = await loadStore();
  const item: EvidenceItem = { id: createId(), ...input };
  store.evidenceItems.push(item);
  await saveStore(store);
  return item;
}

export async function replaceEvidenceItems(
  items: EvidenceItem[],
): Promise<EvidenceItem[]> {
  const store = await loadStore();
  store.evidenceItems = items;
  await saveStore(store);
  return items;
}

export async function deleteEvidenceItem(id: string): Promise<boolean> {
  const store = await loadStore();
  const before = store.evidenceItems.length;
  store.evidenceItems = store.evidenceItems.filter((e) => e.id !== id);
  if (store.evidenceItems.length === before) return false;
  await saveStore(store);
  return true;
}
