import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import type { WeightClassId } from '../types/weather';
import { WEIGHT_CLASSES } from '../constants/droneClasses';

interface WeightClassSelectorProps {
  selectedId: WeightClassId;
  onSelect: (id: WeightClassId) => void;
}

export function WeightClassSelector({ selectedId, onSelect }: WeightClassSelectorProps) {
  return (
    <View className="mb-3">
      <Text className="section-label mb-2">
        Drone weight class
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4">
        {WEIGHT_CLASSES.map((wc) => {
          const isSelected = wc.id === selectedId;
          return (
            <TouchableOpacity
              key={wc.id}
              onPress={() => onSelect(wc.id)}
              className={`mr-2 px-4 py-2.5 rounded-lg ${isSelected ? 'bg-slate-600' : 'bg-card border border-border'}`}
              activeOpacity={0.8}
            >
              <Text className={isSelected ? 'text-white font-medium' : 'text-slate-300'}>
                {wc.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
