import React from 'react';
import { View, Text } from 'react-native';
import type { SafetyStatus } from '../types/weather';

interface SafetyGaugeProps {
  status: SafetyStatus;
}

const statusConfig: Record<SafetyStatus, { label: string; bg: string; text: string }> = {
  green: { label: 'Go', bg: 'bg-safe-green', text: 'text-surface' },
  yellow: { label: 'Caution', bg: 'bg-caution-yellow', text: 'text-surface' },
  red: { label: 'No-Go', bg: 'bg-danger-red', text: 'text-white' },
};

export function SafetyGauge({ status }: SafetyGaugeProps) {
  const config = statusConfig[status];
  return (
    <View className={`rounded-2xl p-6 ${config.bg} ${config.text}`}>
      <Text className="text-center text-sm font-medium uppercase tracking-wider opacity-90">
        Flight conditions
      </Text>
      <Text className="mt-2 text-center text-4xl font-bold">{config.label}</Text>
      <Text className="mt-1 text-center text-sm opacity-90">
        {status === 'green' && 'Conditions acceptable for your drone class.'}
        {status === 'yellow' && 'Marginal — fly with caution.'}
        {status === 'red' && 'Do not fly — unsafe conditions.'}
      </Text>
    </View>
  );
}
