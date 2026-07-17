'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { CONSENT_COOKIE_NAME, GTM_ID, type ConsentState, parseConsentState } from '@/lib/consent'

type ConsentManagerProps = {
  initialConsent: ConsentState
}

const CONSENT_MAX_AGE = 60 * 60 * 24 * 180

function persistConsent(consent: Exclude<ConsentState, null>) {
  const cookieValue = `${CONSENT_COOKIE_NAME}=${consent}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax; Secure`

  document.cookie = cookieValue
  window.localStorage.setItem(CONSENT_COOKIE_NAME, consent)
}

export default function ConsentManager({ initialConsent }: ConsentManagerProps) {
  const [consent, setConsent] = useState<ConsentState>(initialConsent)

  useEffect(() => {
    const storedConsent = parseConsentState(window.localStorage.getItem(CONSENT_COOKIE_NAME) ?? undefined)

    if (storedConsent && storedConsent !== consent) {
      setConsent(storedConsent)
      persistConsent(storedConsent)
    }
  }, [consent])

  const handleConsent = (nextConsent: Exclude<ConsentState, null>) => {
    persistConsent(nextConsent)
    setConsent(nextConsent)
  }

  return (
    <>
      {consent === 'accepted' && (
        <Script id="gtm-loader" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      )}

      {consent === null && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 shadow-2xl backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-2">
              <p className="text-sm font-semibold text-slate-900">Kolačići i anonimna analitika</p>
              <p className="text-sm text-slate-700">
                Koristimo neophodne kolačiće za prijavu, sesiju i bezbedan rad aplikacije. Uz vašu dozvolu uključujemo i Google Tag Manager za anonimnu analitiku bez prikupljanja sadržaja prijava ili drugih direktnih ličnih podataka.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => handleConsent('rejected')}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Samo neophodni kolačići
              </button>
              <button
                type="button"
                onClick={() => handleConsent('accepted')}
                className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white transition hover:bg-secondary-dark"
              >
                Prihvatam anonimnu analitiku
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}