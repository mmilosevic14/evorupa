export const CONSENT_COOKIE_NAME = 'evorupa-consent'
export const GTM_ID = 'GTM-54BV9VPG'

export type ConsentState = 'accepted' | 'rejected' | null

export function parseConsentState(value: string | undefined): ConsentState {
  if (value === 'accepted' || value === 'rejected') {
    return value
  }

  return null
}