/**
 * Legal document links.
 *
 * ── HOW TO PUBLISH THE REAL LINKS ────────────────────────────────────────────
 * Paste the Notion / GitHub / website URL between the quotes below and rebuild.
 * Nothing else needs to change: the buttons are always visible, and while a URL
 * is blank they open a short in-app notice instead of a dead link.
 *
 *   terms:   'https://your-notion-page.notion.site/terms'
 *   privacy: 'https://your-notion-page.notion.site/privacy'
 *
 * Only https:// links are accepted, so a half-finished value can never ship as
 * a broken button.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export type LegalDocument = 'terms' | 'privacy';

export const LEGAL_URLS: Record<LegalDocument, string> = {
  terms: '',
  privacy: '',
};

export const LEGAL_LABELS: Record<LegalDocument, string> = {
  terms: 'Terms of Service',
  privacy: 'Privacy Policy',
};

/** The published URL, or null while the document is still a placeholder. */
export function legalUrl(document: LegalDocument): string | null {
  const url = LEGAL_URLS[document].trim();
  return url.startsWith('https://') ? url : null;
}

export function isLegalPublished(): boolean {
  return legalUrl('terms') !== null && legalUrl('privacy') !== null;
}
