import React from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SearchResult } from "./mapUtils";

interface MapSearchBarProps {
  visible: boolean;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  searchResults: SearchResult[];
  searching: boolean;
  onSelectResult: (item: SearchResult) => void;
  keyExtractor: (item: SearchResult) => string;
}

export function MapSearchBar({
  visible,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  searching,
  onSelectResult,
  keyExtractor,
}: MapSearchBarProps) {
  if (!visible) return null;

  return (
    <>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search place or address…"
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={onSearchQueryChange}
          autoFocus
          returnKeyType="search"
        />
        {searching && <ActivityIndicator size="small" color="#94a3b8" />}
      </View>
      {searchResults.length > 0 && (
        <View style={styles.searchResults}>
          <FlatList
            data={searchResults}
            keyExtractor={keyExtractor}
            renderItem={({ item }) => (
              <Pressable
                style={styles.searchResultItem}
                onPress={() => onSelectResult(item)}
              >
                <Text style={styles.searchResultText} numberOfLines={2}>
                  {item.display_name}
                </Text>
              </Pressable>
            )}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(15,23,42,0.9)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.25)",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#fff",
    paddingVertical: 4,
  },
  searchResults: {
    maxHeight: 180,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "rgba(15,23,42,0.95)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.25)",
    overflow: "hidden",
  },
  searchResultItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(148,163,184,0.2)",
  },
  searchResultText: {
    fontSize: 14,
    color: "#e2e8f0",
  },
});
