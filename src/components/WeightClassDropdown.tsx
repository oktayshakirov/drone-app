import React, { useState } from 'react';
import { View, Text, Pressable, Modal, TouchableOpacity } from 'react-native';
import type { WeightClassId } from '../types/weather';
import { WEIGHT_CLASSES } from '../constants/droneClasses';

interface WeightClassDropdownProps {
  selectedId: WeightClassId;
  onSelect: (id: WeightClassId) => void;
}

export function WeightClassDropdown({ selectedId, onSelect }: WeightClassDropdownProps) {
  const [open, setOpen] = useState(false);
  const selected = WEIGHT_CLASSES.find((c) => c.id === selectedId);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5"
        style={{ minHeight: 44 }}
      >
        <View className="flex-row items-center gap-2">
          <Text className="text-slate-400 text-xs uppercase tracking-wider">Weight class</Text>
          <Text className="text-white font-medium">{selected?.label ?? '—'}</Text>
        </View>
        <Text className="text-slate-500 text-lg">▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setOpen(false)}>
          <Pressable className="bg-card border-t border-border rounded-t-2xl p-4 pb-8" onPress={(e) => e.stopPropagation()}>
            <Text className="section-label mb-3">Drone weight class</Text>
            {WEIGHT_CLASSES.map((wc) => {
              const isSelected = wc.id === selectedId;
              return (
                <TouchableOpacity
                  key={wc.id}
                  onPress={() => {
                    onSelect(wc.id);
                    setOpen(false);
                  }}
                  className={`py-3 px-3 rounded-lg ${isSelected ? 'bg-slate-600' : ''}`}
                  activeOpacity={0.7}
                >
                  <Text className={isSelected ? 'text-white font-medium' : 'text-slate-300'}>
                    {wc.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
