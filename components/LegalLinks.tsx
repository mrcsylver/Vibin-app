import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { COLORS, TILE_COLORS } from '../utils/constants';
import { LEGAL_LABELS, legalUrl, type LegalDocument } from '../utils/legal';

type Props = {
  /** `light` sits on the pastel onboarding, `dark` on the profile sheet. */
  tone?: 'light' | 'dark';
};

const DOCUMENTS: LegalDocument[] = ['terms', 'privacy'];

/**
 * Terms / Privacy footer.
 *
 * The buttons are permanent UI. Publishing the documents is a one-line change in
 * `utils/legal.ts` — until then a tap opens a short notice rather than a dead
 * link, so the layout is identical before and after the real URLs land.
 */
export function LegalLinks({ tone = 'light' }: Props) {
  const [pending, setPending] = useState<LegalDocument | null>(null);
  const dark = tone === 'dark';

  const open = async (document: LegalDocument) => {
    const url = legalUrl(document);
    if (!url) {
      setPending(document);
      return;
    }
    await WebBrowser.openBrowserAsync(url).catch(() => setPending(document));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {DOCUMENTS.map((document, index) => (
          <View key={document} style={styles.row}>
            {index > 0 ? (
              <Text style={[styles.separator, dark && styles.separatorDark]}>·</Text>
            ) : null}
            <Pressable
              onPress={() => void open(document)}
              accessibilityRole="link"
              hitSlop={10}
            >
              {({ pressed }) => (
                <Text style={[styles.link, dark && styles.linkDark, pressed && styles.pressed]}>
                  {LEGAL_LABELS[document]}
                </Text>
              )}
            </Pressable>
          </View>
        ))}
      </View>

      <Modal
        visible={pending !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPending(null)}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{pending ? LEGAL_LABELS[pending] : ''}</Text>
            <Text style={styles.cardBody}>
              This document is not published yet. It will be linked here before Vibin is released on
              the App Store. Thanks for testing the beta.
            </Text>
            <Pressable onPress={() => setPending(null)} style={styles.cardCta}>
              <Text style={styles.cardCtaText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  link: {
    color: COLORS.ctaDeep,
    fontSize: 12,
    fontWeight: '700',
    paddingVertical: 6,
    textDecorationLine: 'underline',
  },
  linkDark: {
    color: TILE_COLORS.ringGold,
  },
  pressed: {
    opacity: 0.55,
  },
  separator: {
    marginHorizontal: 10,
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  separatorDark: {
    color: 'rgba(246, 228, 184, 0.55)',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 15, 36, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    backgroundColor: TILE_COLORS.bezel,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: TILE_COLORS.ringGold,
    padding: 22,
  },
  cardTitle: {
    color: TILE_COLORS.ringGold,
    fontSize: 18,
    fontWeight: '800',
  },
  cardBody: {
    marginTop: 10,
    color: 'rgba(246, 228, 184, 0.85)',
    lineHeight: 20,
    fontWeight: '600',
  },
  cardCta: {
    marginTop: 18,
    paddingVertical: 13,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: COLORS.cta,
  },
  cardCtaText: {
    color: COLORS.white,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
