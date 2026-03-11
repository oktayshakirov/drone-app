import React from "react";
import { Modal, View, Text, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { CustomerInfo } from "react-native-purchases";
import { ENTITLEMENT_PRO } from "../../constants/revenueCat";

interface SubscriptionManagementModalProps {
  visible: boolean;
  onClose: () => void;
  customerInfo: CustomerInfo | null;
  onOpenCustomerCenter: () => Promise<void>;
}

function getPlanLabel(customerInfo: CustomerInfo | null): string {
  if (!customerInfo?.entitlements?.active) return "Pro";
  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_PRO];
  if (!entitlement) return "Pro";
  const id = (entitlement as { productIdentifier?: string }).productIdentifier;
  if (id === "lifetime") return "Lifetime";
  if (id === "monthly") return "Monthly";
  return "Pro";
}

export function SubscriptionManagementModal({
  visible,
  onClose,
  customerInfo,
  onOpenCustomerCenter,
}: SubscriptionManagementModalProps) {
  const planLabel = getPlanLabel(customerInfo);
  const isMonthly = planLabel === "Monthly";
  const isLifetime = planLabel === "Lifetime";

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
          className="bg-card border-t border-border rounded-t-3xl max-h-[70%]"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="w-12 h-1 bg-slate-600 rounded-full self-center mt-3 mb-2" />
          <View className="px-4 pb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-lg font-semibold">
                Manage subscription
              </Text>
              <Pressable
                onPress={onClose}
                className="p-2 -m-2 rounded-lg active:opacity-70"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={24} color="#94a3b8" />
              </Pressable>
            </View>

            <View className="mb-4 py-3 px-4 rounded-xl bg-surface border border-border">
              <Text className="text-slate-400 text-sm">Current plan</Text>
              <Text className="text-white font-semibold text-lg mt-0.5">
                {planLabel}
              </Text>
            </View>

            <Pressable
              onPress={async () => {
                onClose();
                await onOpenCustomerCenter();
              }}
              className="flex-row items-center gap-3 py-3 px-4 rounded-xl bg-surface border border-border active:opacity-80"
            >
              <Ionicons name="card-outline" size={22} color="#94a3b8" />
              <View className="flex-1">
                <Text className="text-white font-medium">
                  Manage in {Platform.OS === "ios" ? "App Store" : "Play Store"}
                </Text>
                <Text className="text-slate-400 text-sm mt-0.5">
                  Cancel, update payment, or change plan
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </Pressable>

            {isMonthly && (
              <View className="mt-4 p-4 rounded-xl bg-safe-green/10 border border-safe-green/30">
                <Text className="text-safe-green font-semibold mb-1">
                  Tip: Save money with Pro Lifetime
                </Text>
                <Text className="text-slate-300 text-sm">
                  Pay once and never worry about renewals. Upgrade to Pro
                  Lifetime to lock in your Pro benefits forever.
                </Text>
              </View>
            )}

            {isLifetime && (
              <View className="mt-4 p-4 rounded-xl bg-safe-green/10 border border-safe-green/30">
                <Text className="text-safe-green font-semibold mb-1">
                  Thank you for supporting DronePal
                </Text>
                <Text className="text-slate-300 text-sm">
                  Your Lifetime purchase unlocks Pro benefits forever. You’ll
                  also receive any future features and improvements we add to
                  the app at no extra cost.
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
