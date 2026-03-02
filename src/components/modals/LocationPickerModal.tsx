import React, { useState, useCallback, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const SEARCH_DEBOUNCE_MS = 300;

interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
}

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: {
    latitude: number;
    longitude: number;
    placeName: string | null;
  }) => void;
  onUseCurrent: () => void;
  currentPlaceName: string | null;
}

export function LocationPickerModal({
  visible,
  onClose,
  onSelect,
  onUseCurrent,
  currentPlaceName,
}: LocationPickerModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchPlaces = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setSearchError(null);
      return;
    }
    setSearching(true);
    setSearchError(null);
    try {
      const url = `${NOMINATIM_URL}?q=${encodeURIComponent(trimmed)}&format=json&limit=5`;
      const res = await fetch(url, {
        headers: { "User-Agent": "DronePal/1.0" },
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      setSearchError("Could not search. Try again.");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!visible || !query.trim()) {
      if (!visible) {
        setQuery("");
        setResults([]);
        setSearchError(null);
      }
      return;
    }
    const t = setTimeout(() => {
      searchPlaces(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, visible, searchPlaces]);

  const handleSelect = (item: SearchResult) => {
    Keyboard.dismiss();
    onSelect({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      placeName: item.display_name || null,
    });
    onClose();
  };

  const handleUseCurrent = () => {
    Keyboard.dismiss();
    onUseCurrent();
    onClose();
  };

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
          className="bg-card border-t border-border rounded-t-3xl max-h-[80%]"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="w-12 h-1 bg-slate-600 rounded-full self-center mt-3 mb-2" />
          <View className="px-4 pb-6">
            <Text className="section-label mb-2">Choose location</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-white text-base mb-3"
              placeholder="Search city or address..."
              placeholderTextColor="#64748b"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {searching && (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#94a3b8" />
              </View>
            )}
            {searchError && (
              <Text className="text-danger-red text-sm mb-2">
                {searchError}
              </Text>
            )}
            {currentPlaceName && (
              <TouchableOpacity
                onPress={handleUseCurrent}
                className="flex-row items-center gap-3 py-3 px-3 rounded-xl bg-surface/80 border border-border mb-3"
                activeOpacity={0.7}
              >
                <Ionicons name="locate" size={22} color="#94a3b8" />
                <View className="flex-1">
                  <Text className="text-white font-medium">
                    Use current location
                  </Text>
                  <Text
                    className="text-slate-400 text-sm mt-0.5"
                    numberOfLines={1}
                  >
                    {currentPlaceName}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            {!searching && results.length > 0 && (
              <FlatList
                data={results}
                keyExtractor={(item) =>
                  `${item.lat}-${item.lon}-${item.display_name}`
                }
                className="max-h-64"
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelect(item)}
                    className="py-3 px-3 rounded-lg border-b border-border/50"
                    activeOpacity={0.7}
                  >
                    <Text className="text-white" numberOfLines={2}>
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
            {!searching &&
              query.trim().length > 0 &&
              results.length === 0 &&
              !searchError && (
                <Text className="text-slate-400 text-sm py-4">
                  No places found. Try a different search.
                </Text>
              )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
