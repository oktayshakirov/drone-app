import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const CARD_BG = "#141414";
const BORDER_COLOR = "#262626";
const SELECTED_BG = "rgba(255, 198, 130, 0.2)";
const TEXT_UNSELECTED = "#cbd5e1";
const TEXT_SELECTED = "#ffffff";
const LABEL_ICON_COLOR = "#94a3b8";
const LABEL_ICON_SIZE = 18;

export interface OptionItem<T = string> {
  id: T;
  label: string;
}

export type OptionListLayout = "vertical" | "horizontal";

interface OptionListProps<T extends string | boolean> {
  options: OptionItem<T>[];
  value: T;
  onSelect: (id: T) => void;
  getKey: (id: T) => string;
  /** Default "vertical". Use "horizontal" for a row of options (e.g. in settings). */
  layout?: OptionListLayout;
  /** Optional section label (e.g. "Units"). Shown above the options. */
  label?: string;
  /** Optional icon next to the label. */
  iconName?: keyof typeof Ionicons.glyphMap;
}

export function OptionList<T extends string | boolean>({
  options,
  value,
  onSelect,
  getKey,
  layout = "vertical",
  label,
  iconName,
}: OptionListProps<T>) {
  const isHorizontal = layout === "horizontal";

  const optionsContent = (
    <View
      style={[
        styles.container,
        isHorizontal && styles.containerHorizontal,
      ]}
    >
      {options.map((opt, index) => {
        const isSelected = value === opt.id;
        const isLast = index === options.length - 1;
        return (
          <TouchableOpacity
            key={getKey(opt.id)}
            onPress={() => onSelect(opt.id)}
            style={[
              styles.optionRow,
              isHorizontal && styles.optionRowHorizontal,
              !isLast && (isHorizontal ? styles.optionRowBorderRight : styles.optionRowBorderBottom),
              isSelected && styles.optionRowSelected,
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.optionText,
                isSelected && styles.optionTextSelected,
                isHorizontal && styles.optionTextHorizontal,
              ]}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (label != null) {
    return (
      <View style={styles.section}>
        <View style={styles.labelRow}>
          {iconName != null && (
            <Ionicons name={iconName} size={LABEL_ICON_SIZE} color={LABEL_ICON_COLOR} />
          )}
          <Text style={styles.labelText}>{label}</Text>
        </View>
        {optionsContent}
      </View>
    );
  }

  return optionsContent;
}

const BORDER_SUBTLE = "rgba(38, 38, 38, 0.5)";

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  labelText: {
    fontSize: 14,
    fontWeight: "500",
    color: LABEL_ICON_COLOR,
  },
  container: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    backgroundColor: CARD_BG,
    overflow: "hidden",
  },
  containerHorizontal: {
    flexDirection: "row",
  },
  optionRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionRowHorizontal: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  optionRowBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER_SUBTLE,
  },
  optionRowBorderRight: {
    borderRightWidth: 1,
    borderRightColor: BORDER_SUBTLE,
  },
  optionRowSelected: {
    backgroundColor: SELECTED_BG,
  },
  optionText: {
    fontSize: 16,
    color: TEXT_UNSELECTED,
  },
  optionTextHorizontal: {
    fontSize: 14,
  },
  optionTextSelected: {
    color: TEXT_SELECTED,
    fontWeight: "500",
  },
});
