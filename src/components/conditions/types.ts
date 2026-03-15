/**
 * Conditions grid types.
 * Two box shapes: cube (1/3 row width) and wide (2/3 row width). Same height for all.
 */

export type ConditionBoxShape = "cube" | "wide";

export interface GridItem {
  title: string;
  value: string;
  metricKey: string;
  shape: ConditionBoxShape;
  /** For sunshine wide item only */
  sunrise?: string | null;
  sunset?: string | null;
  /** For map wide item: show location preview */
  latitude?: number;
  longitude?: number;
  /** For wind direction cube / WindCard: degrees (0–360) for compass */
  directionDegrees?: number | null;
  /** For combined wind (wide) card */
  windSpeedFormatted?: string;
  windGustFormatted?: string;
  windDirectionCardinal?: string;
}

/** Flex basis: wide = 2 units, cube = 1 unit. Row = 3 units (3 cubes or 1 wide + 1 cube). */
export const CUBE_FLEX = 1;
export const WIDE_FLEX = 2;
export const ROW_UNITS = 3;

export const BOX_HEIGHT = 80;
/** Used for tablet (e.g. iPad) so condition boxes are larger; same layout. */
export const BOX_HEIGHT_TABLET = 112;

/** Width breakpoint (px) above which we use tablet layout (larger boxes). */
export const TABLET_BREAKPOINT_WIDTH = 768;
