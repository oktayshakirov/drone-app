/**
 * Golden hour / blue hour times from solar position (SunCalc-style astronomy math).
 *
 * Definitions (photography convention, sun altitude relative to horizon):
 *   - Golden hour: sun between −4° and +6°
 *   - Blue hour:   sun between −6° and −4°
 *
 * At high latitudes the sun may never cross a given altitude on some days;
 * those ranges are returned as null.
 */

const RAD = Math.PI / 180;
const DAY_MS = 86400000;
const J1970 = 2440588;
const J2000 = 2451545;
/** Earth's obliquity of the ecliptic. */
const OBLIQUITY = RAD * 23.4397;
const J0 = 0.0009;

function toJulian(date: Date): number {
  return date.valueOf() / DAY_MS - 0.5 + J1970;
}
function fromJulian(j: number): Date {
  return new Date((j + 0.5 - J1970) * DAY_MS);
}
function toDays(date: Date): number {
  return toJulian(date) - J2000;
}

function solarMeanAnomaly(d: number): number {
  return RAD * (357.5291 + 0.98560028 * d);
}
function eclipticLongitude(M: number): number {
  // Equation of center + perihelion of the Earth.
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const P = RAD * 102.9372;
  return M + C + P + Math.PI;
}
function declination(l: number): number {
  return Math.asin(Math.sin(l) * Math.sin(OBLIQUITY));
}

function julianCycle(d: number, lw: number): number {
  return Math.round(d - J0 - lw / (2 * Math.PI));
}
function approxTransit(Ht: number, lw: number, n: number): number {
  return J0 + (Ht + lw) / (2 * Math.PI) + n;
}
function solarTransitJ(ds: number, M: number, L: number): number {
  return J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
}
function hourAngle(h: number, phi: number, dec: number): number {
  return Math.acos(
    (Math.sin(h) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec)),
  );
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface GoldenBlueHours {
  morningBlue: TimeRange | null;
  morningGolden: TimeRange | null;
  eveningGolden: TimeRange | null;
  eveningBlue: TimeRange | null;
}

/**
 * Times when the sun crosses `angleDeg` altitude on the given date at lat/lon.
 * `rise` = upward crossing (morning), `set` = downward crossing (evening).
 * Returns nulls when the sun never reaches that altitude (polar day/night).
 */
function crossingTimes(
  date: Date,
  latitude: number,
  longitude: number,
  angleDeg: number,
): { rise: Date | null; set: Date | null } {
  const lw = RAD * -longitude;
  const phi = RAD * latitude;
  const d = toDays(date);
  const n = julianCycle(d, lw);
  const ds = approxTransit(0, lw, n);
  const M = solarMeanAnomaly(ds);
  const L = eclipticLongitude(M);
  const dec = declination(L);
  const Jnoon = solarTransitJ(ds, M, L);

  const w = hourAngle(angleDeg * RAD, phi, dec);
  if (Number.isNaN(w)) return { rise: null, set: null };
  const a = approxTransit(w, lw, n);
  const Jset = solarTransitJ(a, M, L);
  const Jrise = Jnoon - (Jset - Jnoon);
  return { rise: fromJulian(Jrise), set: fromJulian(Jset) };
}

/**
 * Golden and blue hour ranges for the given date and location.
 * Any range whose boundary the sun does not cross that day is null.
 */
export function getGoldenBlueHours(
  date: Date,
  latitude: number,
  longitude: number,
): GoldenBlueHours {
  const at6 = crossingTimes(date, latitude, longitude, 6);
  const atMinus4 = crossingTimes(date, latitude, longitude, -4);
  const atMinus6 = crossingTimes(date, latitude, longitude, -6);

  const range = (start: Date | null, end: Date | null): TimeRange | null =>
    start != null && end != null ? { start, end } : null;

  return {
    morningBlue: range(atMinus6.rise, atMinus4.rise),
    morningGolden: range(atMinus4.rise, at6.rise),
    eveningGolden: range(at6.set, atMinus4.set),
    eveningBlue: range(atMinus4.set, atMinus6.set),
  };
}
