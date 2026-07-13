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
  /** Optional secondary line under the value (e.g. wind gust). */
  subValue?: string;
}

export type InfoListLayout = "row" | "wrap";

interface InfoListProps {
  /** Optional section title (e.g. "24h forecast"). */
  title?: string;
  /** Read-only label + value items. */
  items: InfoListItem[];
  /** "row" = single equal-width row (e.g. 24h forecast); "wrap" = wrap into 2 columns. Default "row". */
  layout?: InfoListLayout;
}

/**
 * Read-only list of label/value items. Same visual style as OptionList (card, border)
 * but not clickable. Use for 24h forecast and other info blocks.
 *
 * In "row" layout items share a single equal-width row so the forecast fits the screen;
 * values auto-shrink to fit rather than wrapping or cropping.
 */
export function InfoList({ title, items, layout = "row" }: InfoListProps) {
  if (items.length === 0) return null;

  const isWrap = layout === "wrap";

  return (
    <View style={styles.section}>
      {title != null && <Text style={styles.title}>{title}</Text>}
      <View style={[styles.container, isWrap && styles.containerWrap]}>
        {items.map((item, index) => (
          <View
            key={index}
            style={[styles.item, isWrap ? styles.itemWrap : styles.itemRow]}
          >
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
            <Text
              style={styles.value}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {item.value}
            </Text>
            {item.subValue != null && (
              <Text
                style={styles.subValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {item.subValue}
              </Text>
            )}
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
    paddingHorizontal: 6,
  },
  itemWrap: {
    flexBasis: "48%",
    flexGrow: 0,
    flexShrink: 0,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  label: {
    fontSize: 14,
    color: TEXT_LABEL,
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
    color: TEXT_VALUE,
    marginTop: 4,
    textAlign: "center",
  },
  subValue: {
    fontSize: 13,
    color: TEXT_LABEL,
    marginTop: 2,
    textAlign: "center",
  },
});
