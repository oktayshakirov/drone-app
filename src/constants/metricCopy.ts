/**
 * Short, global “why this matters” copy for the metric education popup.
 * Country-agnostic; references drone size/weight class where relevant.
 */

export interface MetricEducation {
  title: string;
  body: string;
}

export const METRIC_EDUCATION: Record<string, MetricEducation> = {
  wind: {
    title: 'Wind & gusts',
    body:
      'Wind and gusts affect stability and battery use. Lighter drones are more sensitive. ' +
      'Our limits depend on your drone’s weight class. Always check conditions at your flying site.',
  },
  visibility: {
    title: 'Visibility',
    body:
      'Good visibility helps you keep the drone in sight and avoid obstacles. ' +
      'Low visibility makes safe flight harder. Check your local rules for minimum requirements.',
  },
  cloudCover: {
    title: 'Cloud cover',
    body:
      'Staying clear of clouds keeps your visual reference and reduces the risk of flying in or near cloud. ' +
      'Consider cloud base and clearance when planning your flight.',
  },
  temperature: {
    title: 'Temperature',
    body:
      'Cold reduces battery performance and can cause voltage drop. ' +
      'Warm batteries before flight when it’s cold. Very hot conditions can also affect motors and batteries.',
  },
  humidity: {
    title: 'Humidity & dew point',
    body:
      'When dew point is close to temperature, fog or condensation is more likely. ' +
      'High humidity can cause moisture on the lens and sensors. Plan takeoff and landing accordingly.',
  },
  pressure: {
    title: 'Pressure',
    body:
      'Pressure is used for altitude reference and barometer calibration. ' +
      'Low pressure with high temperature can mean lower air density and reduced thrust.',
  },
  precipitation: {
    title: 'Precipitation',
    body:
      'Rain or snow can damage electronics and reduce visibility. ' +
      'Our caution threshold uses precipitation chance; for your drone class, consider staying grounded when rain is likely.',
  },
  sunriseSunset: {
    title: 'Sunrise & sunset',
    body:
      'Many operations are flown in daylight. Sunrise and sunset help you plan flight windows ' +
      'and stay within visual line of sight in good light.',
  },
  uvIndex: {
    title: 'UV index',
    body:
      'UV index indicates sun strength. For long sessions outdoors, protect yourself from sun exposure ' +
      'while you focus on flying safely.',
  },
};

export function getMetricEducation(metricKey: string): MetricEducation | undefined {
  return METRIC_EDUCATION[metricKey];
}
