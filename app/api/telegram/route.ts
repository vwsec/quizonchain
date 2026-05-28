import { NextResponse } from 'next/server';

const rateLimit = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = rateLimit.get(ip)
  if (limit && now < limit.resetTime) {
    if (limit.count >= 3) return false
    limit.count++
  } else {
    rateLimit.set(ip, { count: 1, resetTime: now + 60_000 })
  }
  return true
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "quizonchain.app"
  if (
    (origin && !(origin === `https://${appDomain}` || origin === `https://www.${appDomain}`)) ||
    (referer && !(referer === `https://${appDomain}` || referer === `https://www.${appDomain}`))
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  try {
    const { botToken, chatId, message } = await req.json();

    if (!botToken || !chatId || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json({ error: data.description }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Telegram API proxy error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
