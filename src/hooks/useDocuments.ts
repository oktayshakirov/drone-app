import { useCallback, useEffect, useState } from "react";
import type { PilotDocument } from "../types/documents";
import {
  createEmptyCustomDocument,
  deleteDocument,
  getAllDocuments,
  upsertDocument,
} from "../services/documents";

export function useDocuments() {
  const [documents, setDocuments] = useState<PilotDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const all = await getAllDocuments();
      setDocuments(all);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveDocument = useCallback(
    async (document: Omit<PilotDocument, "createdAt" | "updatedAt">) => {
      setSaving(true);
      try {
        const updated = await upsertDocument(document);
        setDocuments(updated);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save document.");
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const removeDocument = useCallback(async (id: string) => {
    setSaving(true);
    try {
      const updated = await deleteDocument(id);
      setDocuments(updated);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete document.");
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    documents,
    loading,
    saving,
    error,
    load,
    saveDocument,
    removeDocument,
    createEmptyCustomDocument,
  };
}
