/**
 * Map each conditions grid metric to an Ionicons icon name (@expo/vector-icons).
 */
export const CONDITION_ICONS: Record<string, string> = {
  wind: 'leaf-outline',
  visibility: 'eye-outline',
  temperature: 'thermometer-outline',
  humidity: 'water-outline',
  cloudCover: 'cloud-outline',
  pressure: 'speedometer-outline',
  precipitation: 'rainy-outline',
  uvIndex: 'sunny-outline',
  sunriseSunset: 'partly-sunny-outline',
};

export function getConditionIcon(metricKey: string): string {
  return CONDITION_ICONS[metricKey] ?? 'information-circle-outline';
}
