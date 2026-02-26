import type { DroneClassThresholds, WeightClass, WeightClassId } from '../types/weather';

/**
 * Go/No-Go thresholds per weight class.
 * Heavier drones can typically tolerate more wind; thresholds are global operational guidance.
 */
export const DRONE_CLASS_THRESHOLDS: Record<WeightClassId, DroneClassThresholds> = {
  sub250: {
    windGustMphRed: 20,
    visibilityMetersRed: 5000,
    windSpeedMphYellow: 12,
    precipitationChanceYellow: 30,
  },
  '250_500': {
    windGustMphRed: 25,
    visibilityMetersRed: 5000,
    windSpeedMphYellow: 15,
    precipitationChanceYellow: 30,
  },
  '500_1000': {
    windGustMphRed: 30,
    visibilityMetersRed: 5000,
    windSpeedMphYellow: 18,
    precipitationChanceYellow: 35,
  },
  '1000_plus': {
    windGustMphRed: 35,
    visibilityMetersRed: 5000,
    windSpeedMphYellow: 22,
    precipitationChanceYellow: 40,
  },
  custom: {
    // Same as sub250; user can extend later with custom MTOW-based values
    windGustMphRed: 20,
    visibilityMetersRed: 5000,
    windSpeedMphYellow: 12,
    precipitationChanceYellow: 30,
  },
};

export const WEIGHT_CLASSES: WeightClass[] = [
  { id: 'sub250', label: 'Under 250 g', thresholds: DRONE_CLASS_THRESHOLDS.sub250 },
  { id: '250_500', label: '250 g – 500 g', thresholds: DRONE_CLASS_THRESHOLDS['250_500'] },
  { id: '500_1000', label: '500 g – 1 kg', thresholds: DRONE_CLASS_THRESHOLDS['500_1000'] },
  { id: '1000_plus', label: 'Over 1 kg', thresholds: DRONE_CLASS_THRESHOLDS['1000_plus'] },
  { id: 'custom', label: 'Custom', thresholds: DRONE_CLASS_THRESHOLDS.custom },
];

export function getThresholdsForClass(classId: WeightClassId): DroneClassThresholds {
  return DRONE_CLASS_THRESHOLDS[classId];
}
