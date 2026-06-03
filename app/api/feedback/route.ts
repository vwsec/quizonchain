export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'

const rateLimit = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = rateLimit.get(ip)
  if (limit && now < limit.resetTime) {
    if (limit.count >= 2) return false
    limit.count++
  } else {
    rateLimit.set(ip, { count: 1, resetTime: now + 60_000 })
  }
  return true
}

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif']

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.')
  if (dot === -1) return ''
  return filename.slice(dot).toLowerCase()
}

const MAGIC_CHECKERS: ((b: Uint8Array) => boolean)[] = [
  (b) =>
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38,
  (b) =>
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
]

async function validateImageMagic(file: File): Promise<boolean> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer.slice(0, 12))
  return MAGIC_CHECKERS.some((check) => check(bytes))
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '')
}

function shortHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36).slice(0, 8)
}

const ALLOWED_ORIGINS = [
  'https://quizonchain.app',
  'https://www.quizonchain.app',
  'http://localhost:3000',
  'http://localhost:3100',
]

function isAllowed(value: string): boolean {
  const trimmed = value.replace(/\/$/, "")
  if (ALLOWED_ORIGINS.some((allowed) => trimmed === allowed)) return true
  if (trimmed.startsWith('https://quizonchain-')) return true
  return false
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')
  if (origin && !isAllowed(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (referer) {
    const refUrl = referer.replace(/\/$/, "")
    if (!isAllowed(refUrl)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const botToken = process.env.FEEDBACK_TELEGRAM_BOT_TOKEN
  const chatId = process.env.FEEDBACK_TELEGRAM_CHAT_ID

  try {
    const fd = await req.formData()

    const rawTelegram = ((fd.get('telegramUsername') as string) ?? '').trim().replace(/[<>]/g, '')
    const telegramUsername = rawTelegram.replace(/^@/, '').slice(0, 50)
    const rawX = ((fd.get('xUsername') as string) ?? '').trim().replace(/[<>]/g, '')
    const xUsername = rawX.replace(/^@/, '').slice(0, 50)
    const evmAddress = ((fd.get('evmAddress') as string) ?? '').trim().replace(/[<>]/g, '').slice(0, 42)
    const feedbackTextRaw = ((fd.get('feedbackText') as string) ?? '').trim()
    const feedbackText = stripHtml(feedbackTextRaw)

    if (!telegramUsername && !xUsername && !evmAddress) {
      return NextResponse.json(
        { error: 'Please provide at least one contact — we will not forget your feedback.' },
        { status: 400 },
      )
    }

    if (evmAddress && !/^0x[0-9a-fA-F]{40}$/.test(evmAddress)) {
      return NextResponse.json({ error: 'Invalid EVM address format' }, { status: 400 })
    }

    if (telegramUsername && !/^[a-zA-Z0-9_]{5,32}$/.test(telegramUsername)) {
      return NextResponse.json({ error: 'Invalid Telegram username format' }, { status: 400 })
    }

    if (xUsername && !/^[a-zA-Z0-9_]{1,15}$/.test(xUsername)) {
      return NextResponse.json({ error: 'Invalid X username format' }, { status: 400 })
    }

    if (feedbackText.length < 10) {
      return NextResponse.json(
        { error: 'Feedback must be at least 10 characters long.' },
        { status: 400 },
      )
    }

    if (feedbackText.length > 2000) {
      return NextResponse.json(
        { error: 'Feedback must not exceed 2000 characters.' },
        { status: 400 },
      )
    }

    const files: File[] = []
    for (const entry of fd.getAll('images[]')) {
      if (entry instanceof File && entry.size > 0) {
        files.push(entry)
      }
    }

    if (files.length > 4) {
      return NextResponse.json(
        { error: 'Maximum 4 images allowed.' },
        { status: 400 },
      )
    }

    let totalSize = 0
    for (const file of files) {
      const ext = getExtension(file.name)
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          { error: `File "${file.name}" has a disallowed extension. Allowed: PNG, JPG, JPEG, WEBP, GIF.` },
          { status: 400 },
        )
      }

      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File "${file.name}" has a disallowed MIME type. Allowed: PNG, JPG, JPEG, WEBP, GIF.` },
          { status: 400 },
        )
      }

      const valid = await validateImageMagic(file)
      if (!valid) {
        return NextResponse.json(
          { error: `File "${file.name}" has invalid or corrupted image data.` },
          { status: 400 },
        )
      }

      totalSize += file.size
    }

    if (totalSize > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Total image size must not exceed 20 MB.' },
        { status: 400 },
      )
    }

    if (!botToken || !chatId) {
      console.warn('Feedback: FEEDBACK_TELEGRAM_BOT_TOKEN or FEEDBACK_TELEGRAM_CHAT_ID not configured')
      return NextResponse.json({ success: true })
    }

    const ipHash = shortHash(ip)
    const timestamp = new Date().toISOString()

    const parts: string[] = [
      '<b>📮 New Feedback</b>',
      '',
    ]
    if (telegramUsername) parts.push(`<b>Telegram:</b> ${telegramUsername}`)
    if (xUsername) parts.push(`<b>X (Twitter):</b> ${xUsername}`)
    if (evmAddress) parts.push(`<b>EVM Address:</b> <code>${evmAddress}</code>`)
    parts.push('', '<b>Feedback:</b>', feedbackText, '', `<b>Time:</b> ${timestamp}`, `<b>Origin:</b> ${ipHash}`)

    const textPayload = new FormData()
    textPayload.append('chat_id', chatId)
    textPayload.append('text', parts.join('\n'))
    textPayload.append('parse_mode', 'HTML')

    const textRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      body: textPayload,
    })
    const textData = await textRes.json()
    if (!textData.ok) {
      console.error('Feedback: Telegram sendMessage failed:', textData.description)
    }

    for (const file of files) {
      try {
        const photoPayload = new FormData()
        photoPayload.append('chat_id', chatId)
        photoPayload.append('photo', file)

        const photoRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
          method: 'POST',
          body: photoPayload,
        })
        const photoData = await photoRes.json()
        if (!photoData.ok) {
          console.error('Feedback: Telegram sendPhoto failed:', photoData.description)
        }
      } catch (err) {
        console.error('Feedback: Failed to send image to Telegram:', err)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Feedback API error:', error)
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 })
  }
}
