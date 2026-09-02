import { useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { COLORS, STATUS_MAX_LEN, STATUS_PRESETS } from '../utils/constants';

type Props = {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
};

export function StatusComposer({ value, onChange, onSubmit }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {focused ? (
        <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOutDown.duration(160)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {STATUS_PRESETS.map((chip) => (
              <Pressable
                key={chip.id}
                onPress={() => onChange(chip.label)}
                style={styles.chip}
              >
                <Text style={styles.chipText}>{chip.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      ) : null}

      <View style={styles.bar}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="What are you up to?"
          placeholderTextColor="#B0A8BD"
          maxLength={STATUS_MAX_LEN}
          returnKeyType="done"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={() => {
            onSubmit();
            Keyboard.dismiss();
            setFocused(false);
          }}
          style={styles.input}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  chips: {
    gap: 8,
    paddingHorizontal: 2,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(126, 87, 194, 0.18)',
  },
  chipText: {
    fontWeight: '700',
    color: COLORS.ink,
    fontSize: 13,
  },
  bar: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#7E57C2',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  input: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.ink,
  },
});
