import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Brightness from "expo-brightness";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useDocuments } from "../../hooks/useDocuments";
import type { PilotDocument } from "../../types/documents";

interface DocumentsModalProps {
  visible: boolean;
  onClose: () => void;
}

type EditableDocument = Omit<PilotDocument, "createdAt" | "updatedAt">;
const DOCUMENT_IMAGE_ASPECT_RATIO = 16 / 9;

export function DocumentsModal({ visible, onClose }: DocumentsModalProps) {
  const {
    documents,
    loading,
    saving,
    error,
    load,
    saveDocument,
    removeDocument,
    createEmptyCustomDocument,
  } = useDocuments();

  const [editingDocument, setEditingDocument] =
    useState<EditableDocument | null>(null);
  const [previewDocument, setPreviewDocument] = useState<PilotDocument | null>(
    null,
  );
  const [quickShowUri, setQuickShowUri] = useState<string | null>(null);
  const prevBrightnessRef = useRef<number | null>(null);

  const orderedDocuments = useMemo(() => {
    const defaults = documents.filter((d) => d.isDefault);
    const custom = documents.filter((d) => !d.isDefault);
    return [...defaults, ...custom];
  }, [documents]);

  useEffect(() => {
    if (visible) {
      load();
      setEditingDocument(null);
      setPreviewDocument(null);
    }
  }, [visible, load]);

  useEffect(() => {
    let cancelled = false;
    async function applyQuickShowEffects() {
      if (!quickShowUri) {
        try {
          await deactivateKeepAwake();
        } catch {
          // Ignore keep-awake failures.
        }
        if (prevBrightnessRef.current != null) {
          try {
            await Brightness.setBrightnessAsync(prevBrightnessRef.current);
          } catch {
            // Ignore brightness restore failures.
          }
          prevBrightnessRef.current = null;
        }
        return;
      }

      try {
        await activateKeepAwakeAsync();
      } catch {
        // Ignore keep-awake failures.
      }

      try {
        const permission = await Brightness.requestPermissionsAsync();
        if (permission.status === "granted") {
          if (prevBrightnessRef.current == null) {
            prevBrightnessRef.current = await Brightness.getBrightnessAsync();
          }
          if (!cancelled) {
            await Brightness.setBrightnessAsync(1);
          }
        }
      } catch {
        // Ignore brightness failures (best effort).
      }
    }
    applyQuickShowEffects();
    return () => {
      cancelled = true;
    };
  }, [quickShowUri]);

  useEffect(() => {
    return () => {
      deactivateKeepAwake().catch(() => undefined);
      if (prevBrightnessRef.current != null) {
        Brightness.setBrightnessAsync(prevBrightnessRef.current).catch(
          () => undefined,
        );
      }
    };
  }, []);

  const hasUserAddedData = (document: PilotDocument): boolean => {
    const hasCoreData =
      Boolean(document.imageUri) ||
      document.additionalFields.some(
        (field) =>
          field.name.trim().length > 0 || field.value.trim().length > 0,
      );
    return hasCoreData;
  };

  const startEditing = (document: PilotDocument) => {
    setEditingDocument({
      id: document.id,
      typeKey: document.typeKey,
      title: document.title,
      imageUri: document.imageUri,
      additionalFields: document.additionalFields.map((field) => ({
        ...field,
      })),
      isDefault: document.isDefault,
    });
    setPreviewDocument(document);
  };

  const openDocument = (document: PilotDocument) => {
    if (hasUserAddedData(document)) {
      setPreviewDocument(document);
      setEditingDocument(null);
      return;
    }
    startEditing(document);
  };

  const startAddingCustom = () => {
    const draft = createEmptyCustomDocument();
    setPreviewDocument(null);
    setEditingDocument(draft);
  };

  const updateField = <K extends keyof EditableDocument>(
    key: K,
    value: EditableDocument[K],
  ) => {
    setEditingDocument((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const pickImage = async (source: "camera" | "library") => {
    if (!editingDocument) return;
    try {
      if (source === "camera") {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== "granted") {
          Alert.alert("Camera access needed", "Please allow camera access.");
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.8,
          allowsEditing: false,
        });
        if (!result.canceled && result.assets[0]?.uri) {
          updateField("imageUri", result.assets[0].uri);
        }
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== "granted") {
          Alert.alert(
            "Photo access needed",
            "Please allow photo library access.",
          );
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.8,
          allowsEditing: false,
        });
        if (!result.canceled && result.assets[0]?.uri) {
          updateField("imageUri", result.assets[0].uri);
        }
      }
    } catch {
      Alert.alert("Image failed", "Could not attach image right now.");
    }
  };

  const saveEditingDocument = async () => {
    if (!editingDocument) return;
    if (!editingDocument.title.trim()) {
      Alert.alert("Title required", "Please provide a document title.");
      return;
    }

    const cleanedFields = editingDocument.additionalFields
      .map((field) => ({
        name: field.name.trim(),
        value: field.value.trim(),
      }))
      .filter((field) => field.name.length > 0 || field.value.length > 0);

    await saveDocument({
      ...editingDocument,
      title: editingDocument.title.trim(),
      additionalFields: cleanedFields,
    });
    setEditingDocument(null);
    setPreviewDocument(null);
  };

  const requestDelete = () => {
    const activeDocument = editingDocument ?? previewDocument;
    if (!activeDocument) return;
    Alert.alert(
      "Delete document",
      activeDocument.isDefault
        ? "This will permanently delete this default document."
        : "This will permanently delete this document.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await removeDocument(activeDocument.id);
            setEditingDocument(null);
            setPreviewDocument(null);
          },
        },
      ],
    );
  };

  const renderDocCard = (document: PilotDocument) => (
    <Pressable
      key={document.id}
      onPress={() => openDocument(document)}
      className="mb-3 w-[48.5%] rounded-xl border border-border bg-[#141414] p-3 active:opacity-80"
    >
      <View
        className="w-full overflow-hidden rounded-lg border border-border mb-2.5"
        style={{ aspectRatio: DOCUMENT_IMAGE_ASPECT_RATIO }}
      >
        {document.imageUri ? (
          <Image
            source={{ uri: document.imageUri }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center bg-card">
            <Ionicons name="document-text-outline" size={22} color="#64748b" />
          </View>
        )}
      </View>
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1 min-w-0">
          <Text className="text-white text-sm font-medium" numberOfLines={1}>
            {document.title}
          </Text>
          <Text className="text-slate-400 text-xs mt-0.5" numberOfLines={1}>
            {document.imageUri || document.additionalFields.length > 0
              ? "Tap to review details"
              : "Tap to add details"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#64748b" />
      </View>
    </Pressable>
  );

  const renderAddCard = () => (
    <Pressable
      onPress={startAddingCustom}
      className="mb-3 w-[48.5%] rounded-xl border border-border bg-[#141414] p-3 active:opacity-80"
    >
      <View
        className="w-full overflow-hidden rounded-lg border border-dashed border-border mb-2.5 items-center justify-center bg-card"
        style={{ aspectRatio: DOCUMENT_IMAGE_ASPECT_RATIO }}
      >
        <Ionicons name="add" size={24} color="#94a3b8" />
      </View>
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1 min-w-0">
          <Text className="text-white text-sm font-medium" numberOfLines={1}>
            Add Document
          </Text>
          <Text className="text-slate-400 text-xs mt-0.5" numberOfLines={1}>
            Create custom document
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#64748b" />
      </View>
    </Pressable>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
        <Pressable
          className="bg-card border-t border-border rounded-t-3xl max-h-[90%]"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="w-12 h-1 bg-slate-600 rounded-full self-center mt-3 mb-1" />
          <View className="flex-row items-center justify-between px-4 pt-2 pb-3">
            <View className="flex-row items-center gap-2">
              <Ionicons
                name="document-text-outline"
                size={18}
                color="#94a3b8"
              />
              <Text className="text-white text-lg font-semibold">
                Documents
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="p-2 -m-2 rounded-lg active:opacity-70"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={24} color="#94a3b8" />
            </Pressable>
          </View>

          {editingDocument ? (
            <ScrollView
              className="px-4 pb-8"
              showsVerticalScrollIndicator={false}
            >
              <Text className="text-slate-400 text-xs mb-1">Title</Text>
              <TextInput
                value={editingDocument.title}
                onChangeText={(text) => updateField("title", text)}
                className="mb-3 rounded-lg border border-border bg-[#141414] px-3 py-2.5 text-white"
                placeholder="Document title"
                placeholderTextColor="#64748b"
              />

              <Text className="text-slate-400 text-xs mb-1">Image</Text>
              <View className="rounded-lg border border-border bg-[#141414] p-3 mb-3">
                {editingDocument.imageUri ? (
                  <View
                    className="relative overflow-hidden rounded-lg border border-border"
                    style={{ aspectRatio: DOCUMENT_IMAGE_ASPECT_RATIO }}
                  >
                    <Pressable
                      onPress={() =>
                        setQuickShowUri(editingDocument.imageUri ?? null)
                      }
                    >
                      <Image
                        source={{ uri: editingDocument.imageUri }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        setQuickShowUri(editingDocument.imageUri ?? null)
                      }
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-2 active:opacity-80"
                      accessibilityLabel="Open image full screen"
                    >
                      <Ionicons
                        name="expand-outline"
                        size={16}
                        color="#ffffff"
                      />
                    </Pressable>
                  </View>
                ) : (
                  <View
                    className="rounded-lg border border-dashed border-border items-center justify-center"
                    style={{ aspectRatio: DOCUMENT_IMAGE_ASPECT_RATIO }}
                  >
                    <Ionicons name="image-outline" size={24} color="#64748b" />
                    <Text className="text-slate-400 text-xs mt-1">
                      No image attached
                    </Text>
                  </View>
                )}
                <View className="flex-row mt-3 gap-2">
                  <Pressable
                    onPress={() => pickImage("library")}
                    className="flex-1 rounded-lg border border-border px-3 py-2 items-center active:opacity-80"
                  >
                    <Text className="text-slate-200 text-sm">Gallery</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => pickImage("camera")}
                    className="flex-1 rounded-lg border border-border px-3 py-2 items-center active:opacity-80"
                  >
                    <Text className="text-slate-200 text-sm">Camera</Text>
                  </Pressable>
                </View>
              </View>

              <View className="mb-2 mt-1 flex-row items-center justify-between">
                <Text className="text-slate-300 text-sm font-medium">
                  Additional Fields
                </Text>
                <Pressable
                  onPress={() =>
                    updateField("additionalFields", [
                      ...editingDocument.additionalFields,
                      { name: "", value: "" },
                    ])
                  }
                  className="px-2 py-1 rounded-md border border-border active:opacity-80"
                >
                  <Text className="text-slate-300 text-xs">Add field</Text>
                </Pressable>
              </View>

              {editingDocument.additionalFields.map((field, index) => (
                <View
                  key={`${editingDocument.id}_field_${index}`}
                  className="mb-2 rounded-lg border border-border bg-[#141414] p-2"
                >
                  <TextInput
                    value={field.name}
                    onChangeText={(text) => {
                      const next = [...editingDocument.additionalFields];
                      next[index] = { ...next[index], name: text };
                      updateField("additionalFields", next);
                    }}
                    className="mb-2 rounded-md border border-border bg-card px-3 py-2 text-white"
                    placeholder="Field name"
                    placeholderTextColor="#64748b"
                  />
                  <TextInput
                    value={field.value}
                    onChangeText={(text) => {
                      const next = [...editingDocument.additionalFields];
                      next[index] = { ...next[index], value: text };
                      updateField("additionalFields", next);
                    }}
                    className="rounded-md border border-border bg-card px-3 py-2 text-white"
                    placeholder="Field value"
                    placeholderTextColor="#64748b"
                  />
                  <Pressable
                    onPress={() => {
                      const next = editingDocument.additionalFields.filter(
                        (_, i) => i !== index,
                      );
                      updateField("additionalFields", next);
                    }}
                    className="self-end mt-2 px-2 py-1 rounded-md active:opacity-80"
                  >
                    <Text className="text-rose-300 text-xs">Delete field</Text>
                  </Pressable>
                </View>
              ))}

              <Pressable
                onPress={saveEditingDocument}
                disabled={saving}
                className="mt-4 rounded-lg bg-[rgba(255,198,130,0.8)] px-4 py-3 items-center active:opacity-80"
              >
                <Text className="text-black font-semibold">
                  {saving ? "Saving..." : "Save"}
                </Text>
              </Pressable>
              <Pressable
                onPress={requestDelete}
                className="mt-2 rounded-lg border border-rose-300/40 px-4 py-3 items-center active:opacity-80"
              >
                <Text className="text-rose-300 font-medium">
                  Delete document
                </Text>
              </Pressable>
            </ScrollView>
          ) : previewDocument ? (
            <ScrollView
              className="px-4 pb-8"
              showsVerticalScrollIndicator={false}
            >
              <Text className="text-slate-400 text-xs mb-1">Title</Text>
              <View className="mb-3 rounded-lg border border-border bg-[#141414] px-3 py-2.5">
                <Text className="text-white">
                  {previewDocument.title || "Untitled Document"}
                </Text>
              </View>

              <Text className="text-slate-400 text-xs mb-1">Image</Text>
              <View className="rounded-lg border border-border bg-[#141414] p-3 mb-3">
                {previewDocument.imageUri ? (
                  <View
                    className="relative overflow-hidden rounded-lg border border-border"
                    style={{ aspectRatio: DOCUMENT_IMAGE_ASPECT_RATIO }}
                  >
                    <Pressable
                      onPress={() =>
                        setQuickShowUri(previewDocument.imageUri ?? null)
                      }
                    >
                      <Image
                        source={{ uri: previewDocument.imageUri }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        setQuickShowUri(previewDocument.imageUri ?? null)
                      }
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-2 active:opacity-80"
                      accessibilityLabel="Open image full screen"
                    >
                      <Ionicons
                        name="expand-outline"
                        size={16}
                        color="#ffffff"
                      />
                    </Pressable>
                  </View>
                ) : (
                  <View
                    className="rounded-lg border border-dashed border-border items-center justify-center"
                    style={{ aspectRatio: DOCUMENT_IMAGE_ASPECT_RATIO }}
                  >
                    <Ionicons name="image-outline" size={24} color="#64748b" />
                    <Text className="text-slate-400 text-xs mt-1">
                      No image attached
                    </Text>
                  </View>
                )}
              </View>

              <View className="mb-2 mt-1">
                <Text className="text-slate-300 text-sm font-medium">
                  Additional Fields
                </Text>
              </View>
              {previewDocument.additionalFields.length ? (
                previewDocument.additionalFields.map((field, index) => (
                  <View
                    key={`${previewDocument.id}_preview_field_${index}`}
                    className="mb-2 rounded-lg border border-border bg-[#141414] p-2"
                  >
                    <Text className="text-slate-400 text-xs mb-1">
                      {field.name || "Field"}
                    </Text>
                    <Text className="text-white">{field.value || "-"}</Text>
                  </View>
                ))
              ) : (
                <View className="mb-2 rounded-lg border border-border bg-[#141414] p-3">
                  <Text className="text-slate-400 text-sm">
                    No additional fields
                  </Text>
                </View>
              )}

              <Pressable
                onPress={() => startEditing(previewDocument)}
                className="mt-4 rounded-lg bg-[rgba(255,198,130,0.8)] px-4 py-3 items-center active:opacity-80"
              >
                <Text className="text-black font-semibold">Edit</Text>
              </Pressable>
              <Pressable
                onPress={requestDelete}
                className="mt-2 rounded-lg border border-rose-300/40 px-4 py-3 items-center active:opacity-80"
              >
                <Text className="text-rose-300 font-medium">
                  Delete document
                </Text>
              </Pressable>
            </ScrollView>
          ) : (
            <ScrollView
              className="px-4 pb-8"
              showsVerticalScrollIndicator={false}
            >
              <Text className="text-slate-400 text-xs mb-2">
                Keep important documents ready for flights and inspections.
              </Text>
              {loading ? (
                <Text className="text-slate-400 text-sm py-4">
                  Loading documents...
                </Text>
              ) : (
                <View className="flex-row flex-wrap justify-between">
                  {orderedDocuments.map(renderDocCard)}
                  {renderAddCard()}
                </View>
              )}
              {error ? (
                <Text className="text-rose-300 text-xs mt-2">{error}</Text>
              ) : null}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>

      <Modal
        visible={Boolean(quickShowUri)}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setQuickShowUri(null)}
      >
        <View className="flex-1 bg-black">
          <View className="absolute top-12 right-4 z-10">
            <Pressable
              onPress={() => setQuickShowUri(null)}
              className="rounded-full bg-black/50 p-2.5 active:opacity-80"
            >
              <Ionicons name="close" size={22} color="#ffffff" />
            </Pressable>
          </View>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
            maximumZoomScale={4}
            minimumZoomScale={1}
            centerContent
          >
            {quickShowUri ? (
              <Image
                source={{ uri: quickShowUri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </Modal>
  );
}
