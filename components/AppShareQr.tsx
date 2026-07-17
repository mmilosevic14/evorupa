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
    <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-white/15 bg-white/10 p-6 text-left shadow-2xl backdrop-blur-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
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

        <div className="flex justify-center">
          <div className="rounded-2xl bg-white p-4 shadow-lg">
            {qrCodeDataUrl ? (
              <Image
                src={qrCodeDataUrl}
                alt="QR kod za EvoRupa aplikaciju"
                width={176}
                height={176}
                unoptimized
                className="h-44 w-44"
              />
            ) : (
              <div className="flex h-44 w-44 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">
                QR kod se priprema...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
