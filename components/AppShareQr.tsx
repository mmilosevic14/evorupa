'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import ShareButton from '@/components/ShareButton'

const APP_URL = 'https://evorupa.pages.dev/'

export default function AppShareQr() {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')

  useEffect(() => {
    let ignore = false

    QRCode.toDataURL(APP_URL, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 176,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((dataUrl: string) => {
        if (!ignore) {
          setQrCodeDataUrl(dataUrl)
        }
      })
      .catch((error: unknown) => {
        console.error('QR code generation failed:', error)
      })

    return () => {
      ignore = true
    }
  }, [])

  return (
    <>
      <div className="mx-auto mt-10 hidden max-w-3xl rounded-3xl border border-white/15 bg-white/10 p-6 text-left shadow-2xl backdrop-blur-sm md:block">
        <div className="flex items-center justify-between gap-6">
          <div className="max-w-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">Podeli aplikaciju</p>
            <h3 className="mt-2 text-2xl font-bold text-white">Otvori EvoRupa preko QR koda</h3>
            <p className="mt-3 text-sm leading-6 text-blue-100">
              Skeniraj kod telefonom da brzo otvoriš mapu i prijaviš problem na terenu ili podeli direktan link sa drugima.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <ShareButton
                href={APP_URL}
                title="EvoRupa"
                text="Prijavi rupe i infrastrukturne probleme preko EvoRupa aplikacije."
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              />
              <a
                href={APP_URL}
                className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
              >
                Otvori aplikaciju
              </a>
            </div>
          </div>

          <div className="shrink-0 rounded-2xl bg-white p-4 shadow-lg">
            {qrCodeDataUrl ? (
              <Image
                src={qrCodeDataUrl}
                alt="QR kod za EvoRupa aplikaciju"
                width={160}
                height={160}
                unoptimized
                className="block aspect-square h-40 w-40"
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">
                QR kod se priprema...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-sm rounded-3xl border border-white/15 bg-white/10 p-5 text-left shadow-2xl backdrop-blur-sm md:hidden">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">Podeli aplikaciju</p>
            <h3 className="mt-2 text-lg font-bold text-white">Pošalji link ili skeniraj QR</h3>
          </div>
          <div className="rounded-2xl bg-white p-2 shadow-lg">
            {qrCodeDataUrl ? (
              <Image
                src={qrCodeDataUrl}
                alt="QR kod za EvoRupa aplikaciju"
                width={112}
                height={112}
                unoptimized
                className="block aspect-square h-28 w-28"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-500">
                QR kod se priprema...
              </div>
            )}
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-blue-100">
          Na telefonu je praktičnije da odmah podeliš link, a QR ostaje kao brza opcija kada deliš sa desktopa.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <ShareButton
            href={APP_URL}
            title="EvoRupa"
            text="Prijavi rupe i infrastrukturne probleme preko EvoRupa aplikacije."
            className="w-full rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          />
          <a
            href={APP_URL}
            className="w-full rounded-full border border-white/30 px-4 py-2 text-center text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
          >
            Otvori aplikaciju
          </a>
        </div>
      </div>
    </>
  )
}
