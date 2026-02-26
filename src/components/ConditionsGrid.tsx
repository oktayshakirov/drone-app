import React from 'react';
import { View, Text } from 'react-native';
import { WeatherBox } from './WeatherBox';

export type GridItem = {
  title: string;
  value: string;
  metricKey: string;
  shape: 'cube' | 'wide';
};

interface ConditionsGridProps {
  items: GridItem[];
  onMetricPress: (metricKey: string) => void;
}

/**
 * Renders a grid of condition boxes: wide items full width, cube items two per row.
 */
export function ConditionsGrid({ items, onMetricPress }: ConditionsGridProps) {
  const rows: GridItem[][] = [];
  let i = 0;
  while (i < items.length) {
    const item = items[i];
    if (item.shape === 'wide') {
      rows.push([item]);
      i += 1;
    } else {
      const pair: GridItem[] = [item];
      i += 1;
      if (i < items.length && items[i].shape === 'cube') {
        pair.push(items[i]);
        i += 1;
      }
      rows.push(pair);
    }
  }

  return (
    <View className="gap-2">
      <Text className="section-label mb-0.5">Conditions</Text>
      <View className="gap-2">
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row gap-2">
            {row.map((item) => (
              <View
                key={item.metricKey}
                className={item.shape === 'wide' ? 'flex-1' : 'flex-1 min-w-0'}
                style={item.shape === 'cube' ? { flex: 1 } : undefined}
              >
                <WeatherBox
                  title={item.title}
                  value={item.value}
                  metricKey={item.metricKey}
                  shape={item.shape}
                  onPress={onMetricPress}
                />
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
