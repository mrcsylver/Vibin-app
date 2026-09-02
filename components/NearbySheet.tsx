import { forwardRef, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import type { NearbyVibe } from '../types';
import { formatFeet } from '../utils/geo';
import { COLORS } from '../utils/constants';

type Props = {
  vibe: NearbyVibe | null;
  onLike: () => void;
  liking: boolean;
};

export const NearbySheet = forwardRef<BottomSheet, Props>(function NearbySheet(
  { vibe, onLike, liking },
  ref,
) {
  const snapPoints = useMemo(() => ['42%'], []);

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={styles.sheet}
      handleIndicatorStyle={styles.handle}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.25} />
      )}
    >
      <BottomSheetView style={styles.body}>
        {vibe ? (
          <>
            <View style={styles.row}>
              <Image source={{ uri: vibe.album_art_url ?? vibe.avatar_url }} style={styles.art} />
              <View style={{ flex: 1 }}>
                <Text style={styles.kicker}>{formatFeet(vibe.distance_m)} away</Text>
                <Text style={styles.title}>{vibe.track_title ?? 'Nothing playing'}</Text>
                <Text style={styles.artist}>{vibe.track_artist ?? vibe.username}</Text>
              </View>
            </View>
            {vibe.status ? <Text style={styles.status}>{vibe.status}</Text> : null}
            <Pressable onPress={onLike} disabled={liking} style={[styles.like, liking && { opacity: 0.6 }]}>
              <Text style={styles.likeText}>{liking ? 'Sending nudge…' : 'Nudge / Like'}</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.artist}>Tap a nearby avatar</Text>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: 'rgba(255, 248, 231, 0.92)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handle: {
    backgroundColor: '#D1C4E9',
    width: 42,
  },
  body: {
    paddingHorizontal: 22,
    paddingBottom: 28,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  art: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: COLORS.blush,
  },
  kicker: {
    color: COLORS.cta,
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ink,
  },
  artist: {
    marginTop: 4,
    color: COLORS.muted,
    fontWeight: '600',
  },
  status: {
    fontSize: 15,
    color: COLORS.ink,
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  like: {
    backgroundColor: COLORS.cta,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  likeText: {
    color: COLORS.white,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
