import * as Location from 'expo-location';

/** Only re-render the facing cone once the compass has moved this far. */
const HEADING_STEP_DEG = 4;

export type HeadingSubscription = { remove: () => void };

function normalize(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Watch the device compass.
 *
 * `trueHeading` is -1 until iOS has a location fix, so we fall back to magnetic
 * north until true north is available. Updates are quantised so a shaking hand
 * cannot spam React with re-renders.
 */
export async function watchHeading(
  onHeading: (degrees: number) => void,
): Promise<HeadingSubscription | null> {
  const permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted) {
    return null;
  }

  let last: number | null = null;

  try {
    const subscription = await Location.watchHeadingAsync((reading) => {
      const raw = reading.trueHeading >= 0 ? reading.trueHeading : reading.magHeading;
      if (typeof raw !== 'number' || Number.isNaN(raw) || raw < 0) {
        return;
      }

      const next = normalize(raw);
      if (last !== null) {
        const delta = Math.abs(((next - last + 540) % 360) - 180);
        if (delta < HEADING_STEP_DEG) {
          return;
        }
      }
      last = next;
      onHeading(next);
    });

    return { remove: () => subscription.remove() };
  } catch {
    // Simulators and devices without a magnetometer simply never report heading.
    return null;
  }
}
