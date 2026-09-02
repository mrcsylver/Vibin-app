import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { DiceBearStyle } from '../types';
import { DICEBEAR_STYLES, buildAvatarUrl } from '../utils/avatar';
import { COLORS } from '../utils/constants';

type Props = {
  styleId: DiceBearStyle;
  seed: string;
  onStyleChange: (style: DiceBearStyle) => void;
  onShuffle: () => void;
};

export function AvatarPicker({ styleId, seed, onStyleChange, onShuffle }: Props) {
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {DICEBEAR_STYLES.map((style) => {
          const selected = style.id === styleId;
          return (
            <Pressable
              key={style.id}
              onPress={() => onStyleChange(style.id)}
              style={[styles.card, selected && styles.cardSelected]}
            >
              <Image source={{ uri: buildAvatarUrl(style.id, seed) }} style={styles.thumb} />
              <Text style={[styles.label, selected && styles.labelSelected]}>{style.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Pressable onPress={onShuffle} style={styles.shuffle}>
        <Text style={styles.shuffleText}>Shuffle seed</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 12,
    paddingVertical: 4,
  },
  card: {
    width: 96,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 18,
    padding: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: COLORS.cta,
    backgroundColor: COLORS.white,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 18,
  },
  label: {
    marginTop: 8,
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: '600',
    textAlign: 'center',
  },
  labelSelected: {
    color: COLORS.ctaDeep,
  },
  shuffle: {
    alignSelf: 'center',
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(126, 87, 194, 0.12)',
  },
  shuffleText: {
    color: COLORS.ctaDeep,
    fontWeight: '700',
  },
});
