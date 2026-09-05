import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS, STATUS_MAX_LEN, STATUS_PRESETS, TILE_COLORS } from '../utils/constants';

type Props = {
  value: string;
  onChange: (text: string) => void;
  /** Takes the text explicitly so a preset never races the draft state. */
  onSubmit: (text: string) => void;
};

export function StatusComposer({ value, onChange, onSubmit }: Props) {
  const submit = (text: string) => {
    onSubmit(text);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.wrap}>
      {/* Always mounted. Hiding these on blur meant a tap dismissed the keyboard,
          unmounted the row, and the press never landed on anything. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={styles.chips}
      >
        {STATUS_PRESETS.map((chip) => {
          const active = value.trim() === chip.label;
          return (
            <Pressable
              key={chip.id}
              onPress={() => submit(chip.label)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{chip.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.bar}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="What are you up to?"
          placeholderTextColor="rgba(246, 228, 184, 0.45)"
          maxLength={STATUS_MAX_LEN}
          returnKeyType="done"
          onSubmitEditing={(event) => submit(event.nativeEvent.text)}
          style={styles.input}
        />
        <Pressable
          onPress={() => submit(value)}
          style={styles.save}
          hitSlop={6}
          accessibilityRole="button"
        >
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  chips: {
    gap: 8,
    paddingHorizontal: 2,
  },
  chip: {
    backgroundColor: 'rgba(27, 20, 48, 0.82)',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 217, 122, 0.4)',
  },
  chipActive: {
    backgroundColor: TILE_COLORS.ringGold,
    borderColor: TILE_COLORS.ringGold,
  },
  chipText: {
    fontWeight: '700',
    color: TILE_COLORS.ringParchment,
    fontSize: 13,
  },
  chipTextActive: {
    color: TILE_COLORS.bezel,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(27, 20, 48, 0.88)',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 217, 122, 0.35)',
    paddingRight: 6,
  },
  input: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 13,
    fontSize: 16,
    color: TILE_COLORS.ringParchment,
  },
  save: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: COLORS.cta,
  },
  saveText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
  },
});
