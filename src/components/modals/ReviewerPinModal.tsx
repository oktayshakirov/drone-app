import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const REVIEWER_PIN = "12345";

interface ReviewerPinModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewerPinModal({
  visible,
  onClose,
  onSuccess,
}: ReviewerPinModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (pin.trim() === REVIEWER_PIN) {
      setPin("");
      setError(null);
      onSuccess();
      onClose();
    } else {
      setError("Invalid PIN");
    }
  };

  const handleClose = () => {
    setPin("");
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable
        className="flex-1 bg-black/60 justify-center items-center p-6"
        onPress={handleClose}
      >
        <Pressable
          className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm"
          onPress={(e) => e.stopPropagation()}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-lg font-semibold">
                Reviewer access
              </Text>
              <Pressable
                onPress={handleClose}
                className="p-2 -m-2 rounded-lg active:opacity-70"
              >
                <Ionicons name="close" size={24} color="#94a3b8" />
              </Pressable>
            </View>
            <Text className="text-slate-400 text-sm mb-3">
              Enter PIN to unlock Pro for 24 hours
            </Text>
            <TextInput
              value={pin}
              onChangeText={(t) => {
                setPin(t);
                setError(null);
              }}
              placeholder="PIN"
              placeholderTextColor="#64748b"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={10}
              className="bg-slate-800 border border-border rounded-xl px-4 py-3 text-white text-lg mb-3"
            />
            {error ? (
              <Text className="text-danger-red text-sm mb-3">{error}</Text>
            ) : null}
            <View className="flex-row gap-3">
              <Pressable
                onPress={handleClose}
                className="flex-1 py-3 rounded-xl bg-slate-700 items-center active:opacity-80"
              >
                <Text className="text-slate-300 font-medium">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                className="flex-1 py-3 rounded-xl bg-safe-green items-center active:opacity-80"
              >
                <Text className="text-white font-medium">Unlock</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
