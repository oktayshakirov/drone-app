import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  DefaultDocumentDefinition,
  DefaultDocumentTypeKey,
  PilotDocument,
} from "../types/documents";

const DOCUMENTS_STORAGE_KEY = "dronepal_documents_v1";
const DELETED_DEFAULT_TYPES_KEY = "dronepal_documents_deleted_defaults_v1";

const DEFAULT_DOCUMENTS: DefaultDocumentDefinition[] = [
  { typeKey: "drone_registration", title: "Drone Registration" },
  { typeKey: "pilot_registration", title: "Pilot Registration" },
  { typeKey: "insurance", title: "Insurance" },
];

function makeId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function createDefaultDocument(def: DefaultDocumentDefinition): PilotDocument {
  const now = Date.now();
  return {
    id: makeId(),
    typeKey: def.typeKey,
    title: def.title,
    imageUri: undefined,
    additionalFields: [],
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeDocument(raw: unknown): PilotDocument | null {
  if (!raw || typeof raw !== "object") return null;
  const doc = raw as Partial<PilotDocument>;
  if (!doc.id || !doc.title) return null;

  const normalizedTypeKey =
    doc.typeKey === "drone_registration" ||
    doc.typeKey === "pilot_registration" ||
    doc.typeKey === "insurance"
      ? doc.typeKey
      : null;

  return {
    id: String(doc.id),
    typeKey: normalizedTypeKey,
    title: String(doc.title),
    imageUri: doc.imageUri ? String(doc.imageUri) : undefined,
    additionalFields: Array.isArray(doc.additionalFields)
      ? doc.additionalFields
          .map((field) => {
            if (!field || typeof field !== "object") return null;
            const f = field as { name?: unknown; value?: unknown };
            return {
              name: typeof f.name === "string" ? f.name : "",
              value: typeof f.value === "string" ? f.value : "",
            };
          })
          .filter((field): field is { name: string; value: string } =>
            Boolean(field),
          )
      : [],
    isDefault: Boolean(doc.isDefault),
    createdAt: typeof doc.createdAt === "number" ? doc.createdAt : Date.now(),
    updatedAt: typeof doc.updatedAt === "number" ? doc.updatedAt : Date.now(),
  };
}

async function readDocuments(): Promise<PilotDocument[]> {
  try {
    const raw = await AsyncStorage.getItem(DOCUMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normalizeDocument(item))
      .filter((item): item is PilotDocument => Boolean(item));
  } catch {
    return [];
  }
}

async function writeDocuments(documents: PilotDocument[]): Promise<void> {
  await AsyncStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(documents));
}

async function readDeletedDefaultTypeKeys(): Promise<Set<DefaultDocumentTypeKey>> {
  try {
    const raw = await AsyncStorage.getItem(DELETED_DEFAULT_TYPES_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter(
        (key): key is DefaultDocumentTypeKey =>
          key === "drone_registration" ||
          key === "pilot_registration" ||
          key === "insurance",
      ),
    );
  } catch {
    return new Set();
  }
}

async function writeDeletedDefaultTypeKeys(
  keys: Set<DefaultDocumentTypeKey>,
): Promise<void> {
  await AsyncStorage.setItem(
    DELETED_DEFAULT_TYPES_KEY,
    JSON.stringify(Array.from(keys)),
  );
}

function sortDocuments(documents: PilotDocument[]): PilotDocument[] {
  const defaultOrder: DefaultDocumentTypeKey[] = [
    "drone_registration",
    "pilot_registration",
    "insurance",
  ];
  return [...documents].sort((a, b) => {
    if (a.isDefault && b.isDefault) {
      const aIndex = defaultOrder.findIndex((x) => x === a.typeKey);
      const bIndex = defaultOrder.findIndex((x) => x === b.typeKey);
      return aIndex - bIndex;
    }
    if (a.isDefault) return -1;
    if (b.isDefault) return 1;
    return b.updatedAt - a.updatedAt;
  });
}

export async function ensureDefaultDocuments(): Promise<PilotDocument[]> {
  const current = await readDocuments();
  const deletedDefaults = await readDeletedDefaultTypeKeys();
  const byTypeKey = new Map<DefaultDocumentTypeKey, PilotDocument>();
  const keep: PilotDocument[] = [];

  for (const doc of current) {
    if (
      doc.typeKey &&
      (doc.typeKey === "drone_registration" ||
        doc.typeKey === "pilot_registration" ||
        doc.typeKey === "insurance")
    ) {
      if (!byTypeKey.has(doc.typeKey)) {
        byTypeKey.set(doc.typeKey, { ...doc, isDefault: true });
        keep.push({ ...doc, isDefault: true });
      }
      continue;
    }
    keep.push({ ...doc, isDefault: false, typeKey: null });
  }

  let hasChanges = keep.length !== current.length;
  for (const def of DEFAULT_DOCUMENTS) {
    if (deletedDefaults.has(def.typeKey)) {
      continue;
    }
    if (!byTypeKey.has(def.typeKey)) {
      keep.push(createDefaultDocument(def));
      hasChanges = true;
    }
  }

  const sorted = sortDocuments(keep);
  if (hasChanges) {
    await writeDocuments(sorted);
  }
  return sorted;
}

export async function getAllDocuments(): Promise<PilotDocument[]> {
  return ensureDefaultDocuments();
}

export async function upsertDocument(
  input: Omit<PilotDocument, "createdAt" | "updatedAt">,
): Promise<PilotDocument[]> {
  if (input.typeKey) {
    const deletedDefaults = await readDeletedDefaultTypeKeys();
    if (deletedDefaults.has(input.typeKey)) {
      deletedDefaults.delete(input.typeKey);
      await writeDeletedDefaultTypeKeys(deletedDefaults);
    }
  }
  const current = await ensureDefaultDocuments();
  const now = Date.now();
  const existing = current.find((d) => d.id === input.id);
  const nextDoc: PilotDocument = {
    ...input,
    isDefault: Boolean(input.typeKey),
    typeKey: input.typeKey ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const next = existing
    ? current.map((doc) => (doc.id === input.id ? nextDoc : doc))
    : [nextDoc, ...current];
  const sorted = sortDocuments(next);
  await writeDocuments(sorted);
  return sorted;
}

export async function deleteDocument(id: string): Promise<PilotDocument[]> {
  const current = await ensureDefaultDocuments();
  const target = current.find((doc) => doc.id === id);
  if (!target) return current;
  const next = current.filter((doc) => doc.id !== id);
  if (target.typeKey) {
    const deletedDefaults = await readDeletedDefaultTypeKeys();
    deletedDefaults.add(target.typeKey);
    await writeDeletedDefaultTypeKeys(deletedDefaults);
  }
  const sorted = sortDocuments(next);
  await writeDocuments(sorted);
  return sorted;
}

export function createEmptyCustomDocument(): Omit<
  PilotDocument,
  "createdAt" | "updatedAt"
> {
  return {
    id: makeId(),
    typeKey: null,
    title: "Untitled Document",
    imageUri: undefined,
    additionalFields: [],
    isDefault: false,
  };
}
