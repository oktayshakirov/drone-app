/**
 * Map each conditions grid metric to an Ionicons icon name (@expo/vector-icons).
 */
export const CONDITION_ICONS: Record<string, string> = {
  wind: 'leaf-outline',
  gust: 'flag-outline',
  windDirection: 'compass-outline',
  visibility: 'eye-outline',
  temperature: 'thermometer-outline',
  humidity: 'water-outline',
  cloudCover: 'cloud-outline',
  precipitation: 'rainy-outline',
  uvIndex: 'sunny-outline',
  kpIndex: 'magnet-outline',
  sunriseSunset: 'partly-sunny-outline',
};

export function getConditionIcon(metricKey: string): string {
  return CONDITION_ICONS[metricKey] ?? 'information-circle-outline';
}
