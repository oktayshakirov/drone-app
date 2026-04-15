import React from "react";
import { Modal, View, Text, Pressable, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  CAMERA_TUTORIALS,
  type CameraTutorial,
} from "../../constants/cameraTutorials";
import { CameraTutorialDetailContent } from "./CameraTutorialDetailModal";

export interface CameraTutorialListModalProps {
  visible: boolean;
  onClose: () => void;
  /** When set, detail sheet is shown above the list inside the same Modal. */
  selectedTutorial: CameraTutorial | null;
  onCloseDetail: () => void;
  /** Pro subscribers: no lock on tutorial rows. */
  isPro: boolean;
  /** Called when user selects a tutorial (parent applies Free/Pro gating). */
  onSelectTutorial: (tutorial: CameraTutorial) => void;
}

export function CameraTutorialListModal({
  visible,
  onClose,
  selectedTutorial,
  onCloseDetail,
  isPro,
  onSelectTutorial,
}: CameraTutorialListModalProps) {
  if (!visible) return null;

  const handleBackdropPress = () => {
    if (selectedTutorial) onCloseDetail();
    else onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (selectedTutorial) onCloseDetail();
        else onClose();
      }}
    >
      <View className="flex-1 justify-end">
        <Pressable
          className="absolute inset-0 bg-black/60"
          onPress={handleBackdropPress}
        />

        <Pressable
          className="bg-card border-t border-border rounded-t-3xl max-h-[85%] z-[1]"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="w-12 h-1 bg-slate-600 rounded-full self-center mt-3 mb-1" />
          <View className="flex-row items-center justify-between px-4 pt-2 pb-2">
            <View className="flex-1 min-w-0 pr-2">
              <Text className="text-white text-lg font-semibold">
                Camera tutorials
              </Text>
              <Text className="text-slate-400 text-xs mt-0.5">
                Quick guides for cinematic drone shots
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

          <ScrollView
            className="px-4 pb-8"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-row flex-wrap justify-between">
              {CAMERA_TUTORIALS.map((tutorial) => {
                const isProTutorial = tutorial.access === "pro";
                const showLock = isProTutorial && !isPro;
                return (
                  <Pressable
                    key={tutorial.id}
                    onPress={() => onSelectTutorial(tutorial)}
                    className="mb-3 w-[48.5%] rounded-xl border border-border bg-[#141414] p-2.5 active:opacity-80"
                  >
                    <View className="mb-2 flex-row items-start gap-2">
                      <View className="w-7 items-center pt-0.5">
                        <Ionicons
                          name={
                            tutorial.iconName as React.ComponentProps<
                              typeof Ionicons
                            >["name"]
                          }
                          size={20}
                          color="#94a3b8"
                        />
                      </View>
                      <Text
                        className="flex-1 text-white font-medium text-sm leading-5"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {tutorial.title}
                      </Text>
                      <View className="flex-row items-center gap-0.5">
                        {showLock ? (
                          <Ionicons
                            name="lock-closed-outline"
                            size={14}
                            color="#94a3b8"
                          />
                        ) : null}
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color="#64748b"
                        />
                      </View>
                    </View>

                    <View
                      className="w-full overflow-hidden rounded-lg border border-border"
                      style={{ aspectRatio: 16 / 9 }}
                    >
                      {tutorial.exampleImage ? (
                        <Image
                          source={tutorial.exampleImage}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                          accessibilityLabel={`Preview image for ${tutorial.title}`}
                        />
                      ) : (
                        <View className="flex-1 items-center justify-center">
                          <Ionicons
                            name={
                              tutorial.iconName as React.ComponentProps<
                                typeof Ionicons
                              >["name"]
                            }
                            size={22}
                            color="#64748b"
                          />
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </Pressable>

        {selectedTutorial ? (
          <View
            className="absolute inset-0 z-[10] justify-end"
            pointerEvents="box-none"
            style={{ elevation: 24 }}
          >
            <Pressable
              className="absolute inset-0 bg-black/50"
              onPress={onCloseDetail}
            />
            <Pressable
              className="w-full bg-card border-t border-border rounded-t-3xl p-6 max-h-[85%] z-[11]"
              onPress={(e) => e.stopPropagation()}
              style={{ elevation: 26 }}
            >
              <View className="w-12 h-1 bg-slate-600 rounded-full self-center mt-1 mb-2" />
              <View className="flex-row items-center justify-end -mt-2 mb-2">
                <Pressable
                  onPress={onCloseDetail}
                  className="p-2 -m-2 rounded-lg active:opacity-70"
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close" size={24} color="#94a3b8" />
                </Pressable>
              </View>
              <CameraTutorialDetailContent tutorial={selectedTutorial} />
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
