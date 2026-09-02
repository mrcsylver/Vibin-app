import { RADIUS_FT, RADIUS_M } from './constants';

export function metersToFeet(meters: number): number {
  return meters * 3.28084;
}

export function clampToRadar(distanceM: number): number {
  return Math.min(Math.max(distanceM, 0), RADIUS_M);
}

/**
 * Project a geodesic polar offset onto the radar canvas.
 * Bearing 0° is north (up on screen). The outermost ring is RADIUS_FT.
 */
export function polarToCanvas(
  distanceM: number,
  bearingDeg: number,
  radarRadiusPx: number,
): { x: number; y: number } {
  const t = clampToRadar(distanceM) / RADIUS_M;
  const r = t * radarRadiusPx;
  const rad = (bearingDeg * Math.PI) / 180;
  return {
    x: Math.sin(rad) * r,
    y: -Math.cos(rad) * r,
  };
}

export function formatFeet(distanceM: number): string {
  const ft = Math.max(1, Math.round(metersToFeet(distanceM)));
  return `${Math.min(ft, RADIUS_FT)} ft`;
}
