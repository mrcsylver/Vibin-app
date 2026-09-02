import * as TaskManager from 'expo-task-manager';
import type * as Location from 'expo-location';
import { LOCATION_TASK_NAME, syncHeartbeat } from './locationEngine';

type LocationTaskData = {
  locations: Location.LocationObject[];
};

/**
 * Must be evaluated at import time (see index.ts) so the OS can wake the JS
 * runtime when a background location event arrives.
 */
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.warn('[vibin] location task error', error.message);
    return;
  }

  const locations = (data as LocationTaskData | undefined)?.locations;
  const last = locations?.[locations.length - 1];
  if (!last) {
    return;
  }

  try {
    await syncHeartbeat({
      latitude: last.coords.latitude,
      longitude: last.coords.longitude,
    });
  } catch (err) {
    console.warn('[vibin] heartbeat failed', err);
  }
});
