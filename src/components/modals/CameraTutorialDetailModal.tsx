import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  useWindowDimensions,
} from "react-native";
import type { CameraTutorial } from "../../constants/cameraTutorials";
import { Ionicons } from "@expo/vector-icons";
import { InfoList, type InfoListItem } from "../ui/InfoList";

/** Presentational tutorial detail (no Modal). Use inside `CameraTutorialListModal` overlay or standalone. */
export function CameraTutorialDetailContent({
  tutorial,
}: {
  tutorial: CameraTutorial;
}) {
  const { height: windowHeight } = useWindowDimensions();
  /** Keeps example inside the sheet; rest scrolls below. */
  const exampleImageBoxMaxHeight = Math.min(windowHeight * 0.34, 280);

  const imageAspectRatio = useMemo(() => {
    if (!tutorial.exampleImage) return 16 / 9;
    const source = Image.resolveAssetSource(tutorial.exampleImage);
    if (!source?.width || !source?.height) return 16 / 9;
    return source.width / source.height;
  }, [tutorial.exampleImage]);

  const infoItems = useMemo((): InfoListItem[] => {
    const rows: InfoListItem[] = [];
    if (tutorial.fps) rows.push({ label: "FPS", value: tutorial.fps });
    if (tutorial.iso) rows.push({ label: "ISO", value: tutorial.iso });
    if (tutorial.shutter) rows.push({ label: "Shutter", value: tutorial.shutter });
    if (tutorial.nd) rows.push({ label: "ND Filter", value: tutorial.nd });
    return rows;
  }, [tutorial]);

  return (
    <ScrollView className="pb-6" showsVerticalScrollIndicator={false}>
      <View className="flex-row items-start gap-3 mb-4">
        <View className="w-10 h-10 rounded-lg items-center justify-center">
          <Ionicons
            name={tutorial.iconName as React.ComponentProps<typeof Ionicons>["name"]}
            size={24}
            color="#94a3b8"
          />
        </View>
        <View className="flex-1 min-w-0">
          <Text className="text-white text-2xl font-semibold leading-tight">
            {tutorial.title}
          </Text>
        </View>
      </View>

      {tutorial.exampleImage ? (
        <View
          className="mb-4 w-full max-w-full self-center rounded-xl overflow-hidden border border-border bg-black"
          style={{ aspectRatio: imageAspectRatio, maxHeight: exampleImageBoxMaxHeight }}
        >
          <Image
            source={tutorial.exampleImage}
            style={{ width: "100%", height: "100%" }}
            resizeMode="contain"
            accessibilityLabel={`Example look for ${tutorial.title}`}
          />
        </View>
      ) : null}


      {tutorial.description ? (
        <Text className="text-slate-300 text-sm leading-6 mb-4">
          {tutorial.description}
        </Text>
      ) : null}

      {infoItems.length > 0 ? (
        <InfoList title="Configuration" items={infoItems} layout="wrap" />
      ) : null}
    </ScrollView>
  );
}
