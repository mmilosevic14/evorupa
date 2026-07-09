import { NextResponse } from 'next/server'
import sharp from 'sharp'

export const runtime = 'nodejs'

const MAX_IMAGE_BYTES = 15 * 1024 * 1024

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

async function readSourceBuffer(formData: FormData) {
  const file = formData.get('file')
  const sourceUrl = formData.get('sourceUrl')

  if (file instanceof File) {
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error('Otpremljena slika je prevelika. Maksimalna veličina je 15MB.')
    }

    return Buffer.from(await file.arrayBuffer())
  }

  if (typeof sourceUrl === 'string' && sourceUrl.trim()) {
    if (!isValidHttpUrl(sourceUrl.trim())) {
      throw new Error('URL slike mora koristiti http ili https protokol.')
    }

    const response = await fetch(sourceUrl.trim(), {
      headers: {
        'User-Agent': 'EvoRupa/1.0 image processor',
      },
      signal: AbortSignal.timeout(20000),
    })

    if (!response.ok) {
      throw new Error(`Nije moguće preuzeti sliku sa URL adrese. Status: ${response.status}`)
    }

    const contentLengthHeader = response.headers.get('content-length')

    if (contentLengthHeader && Number(contentLengthHeader) > MAX_IMAGE_BYTES) {
      throw new Error('Izvorna slika je prevelika. Maksimalna veličina je 15MB.')
    }

    return Buffer.from(await response.arrayBuffer())
  }

  throw new Error('Pošaljite sliku kao fajl ili navedite izvorni URL slike.')
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const sourceBuffer = await readSourceBuffer(formData)
    const convertedBuffer = await sharp(sourceBuffer)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()

    return new NextResponse(new Uint8Array(convertedBuffer), {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Image processing error:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Nije moguće obraditi sliku i pretvoriti je u WebP.',
      },
      { status: 400 },
    )
  }
}