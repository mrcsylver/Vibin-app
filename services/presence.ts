import { RADIUS_M } from '../utils/constants';
import type { NearbyVibe, NowPlaying, Profile } from '../types';
import { supabase } from './supabase';

export async function pushPresence(
  profile: Profile,
  coords: { latitude: number; longitude: number },
  track: NowPlaying,
): Promise<void> {
  const { error } = await supabase.rpc('upsert_presence', {
    p_spotify_id: profile.hashedId,
    p_username: profile.username,
    p_avatar_url: profile.avatarUrl,
    p_status: profile.status,
    p_track_title: track.title,
    p_track_artist: track.artist,
    p_album_art_url: track.albumArtUrl,
    p_album_color: track.albumColor,
    p_lat: coords.latitude,
    p_lng: coords.longitude,
  });

  if (error) {
    throw error;
  }
}

export async function pushStatus(hashedId: string, status: string): Promise<void> {
  const { error } = await supabase.rpc('update_status', {
    p_spotify_id: hashedId,
    p_status: status,
  });
  if (error) {
    throw error;
  }
}

export async function fetchNearby(
  hashedId: string,
  coords: { latitude: number; longitude: number },
): Promise<NearbyVibe[]> {
  const { data, error } = await supabase.rpc('nearby_users', {
    p_lat: coords.latitude,
    p_lng: coords.longitude,
    p_spotify_id: hashedId,
    p_radius_m: RADIUS_M,
  });

  if (error) {
    throw error;
  }
  return (data ?? []) as NearbyVibe[];
}

export async function sendLike(
  fromHashedId: string,
  toHashedId: string,
  distanceFt: number,
): Promise<void> {
  const { error } = await supabase.rpc('insert_like', {
    p_from_spotify_id: fromHashedId,
    p_to_spotify_id: toHashedId,
    p_distance_ft: distanceFt,
  });
  if (error) {
    throw error;
  }
}

/**
 * Erase everything this listener created: presence, both sides of their like
 * history, and their lifetime tallies. Required by App Store guideline
 * 5.1.1(v), which wants an in-app way to delete what an account produced.
 */
export async function deleteMyData(hashedId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_my_data', { p_spotify_id: hashedId });
  if (error) {
    throw error;
  }
}
