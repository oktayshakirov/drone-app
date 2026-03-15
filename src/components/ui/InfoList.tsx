import React from "react";
import { View, Text, StyleSheet } from "react-native";

/** Same colors as OptionList for consistent look (read-only, no selection). */
const CARD_BG = "#141414";
const BORDER_COLOR = "#262626";
const TEXT_LABEL = "#94a3b8";
const TEXT_VALUE = "#f1f5f9";

export interface InfoListItem {
  label: string;
  value: string;
}

export type InfoListLayout = "row" | "wrap";

interface InfoListProps {
  /** Optional section title (e.g. "24h forecast"). */
  title?: string;
  /** Read-only label + value items. */
  items: InfoListItem[];
  /** "row" = single row; "wrap" = wrap into 2 columns (e.g. wind). Default "row". */
  layout?: InfoListLayout;
}

/**
 * Read-only list of label/value items. Same visual style as OptionList (card, border)
 * but not clickable. Use for 24h forecast and other info blocks.
 */
export function InfoList({
  title,
  items,
  layout = "row",
}: InfoListProps) {
  if (items.length === 0) return null;

  const isWrap = layout === "wrap";

  return (
    <View style={styles.section}>
      {title != null && <Text style={styles.title}>{title}</Text>}
      <View style={[styles.container, isWrap && styles.containerWrap]}>
        {items.map((item, index) => (
          <View
            key={index}
            style={[
              styles.item,
              isWrap ? styles.itemWrap : styles.itemRow,
            ]}
          >
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "500",
    color: TEXT_LABEL,
    marginBottom: 8,
  },
  container: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 6,
  },
  containerWrap: {
    flexWrap: "wrap",
    gap: 8,
  },
  item: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  itemRow: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  itemWrap: {
    flexBasis: "48%",
    flexGrow: 0,
    flexShrink: 0,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  label: {
    fontSize: 15,
    color: TEXT_LABEL,
  },
  value: {
    fontSize: 17,
    fontWeight: "500",
    color: TEXT_VALUE,
    marginTop: 4,
    textAlign: "center",
  },
});
