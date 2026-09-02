/**
 * Utility for interacting with the Telegram Bot API via our local proxy.
 */

export async function sendTelegramMessage(botToken: string, chatId: string, message: string) {
  try {
    const response = await fetch('/api/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        botToken,
        chatId,
        message,
      }),
    });

    if (!response.ok) {
      const text = await response.text()
      throw new Error(text.slice(0, 200))
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error sending Telegram message:', error);
    throw error;
  }
}

export function formatTxAlertMessage(
  tx: any,
  network: string,
  explorerBase: string,
  nativeCurrency: { symbol: string; decimals: number }
) {
  const numericValue = tx.value ? Number(BigInt(tx.value)) / 1e18 : 0;

  let value: string;
  if (numericValue === 0) {
    value = `0.00 ${nativeCurrency.symbol}`;
  } else if (numericValue < 0.001) {
    value = `<0.001 ${nativeCurrency.symbol}`;
  } else if (numericValue >= 1_000_000) {
    value = `${(numericValue / 1_000_000).toFixed(2)}M ${nativeCurrency.symbol}`;
  } else if (numericValue >= 1_000) {
    value = `${(numericValue / 1_000).toFixed(2)}K ${nativeCurrency.symbol}`;
  } else {
    value = `${numericValue.toFixed(4)} ${nativeCurrency.symbol}`;
  }
  const type = tx.transaction_types?.join(', ') || 'Transaction';
  const hash = tx.hash;
  const from = tx.from?.hash ? `${tx.from.hash.slice(0, 6)}...${tx.from.hash.slice(-4)}` : 'Unknown';
  const to = tx.to?.hash ? `${tx.to.hash.slice(0, 6)}...${tx.to.hash.slice(-4)}` : 'Contract Creation';

  return `
<b>New High-Value Transaction on ${network}</b>

<b>Type:</b> ${type}
<b>Value:</b> ${value}
<b>From:</b> ${from}
<b>To:</b> ${to}

<a href="${explorerBase}/tx/${hash}">View on Explorer</a>
  `.trim();
}

export function formatFreezeAlert(
  tx: any,
  network: string,
  explorerBase: string,
  frozenAddress: string,
  tokenAddress: string,
  nativeCurrency: { symbol: string; decimals: number }
) {
  const value = tx.value ? Number(BigInt(tx.value)) / Math.pow(10, nativeCurrency.decimals) : 0
  const valueStr = value > 0
    ? (value >= 1_000_000 ? `${(value / 1_000_000).toFixed(2)}M` : value.toFixed(4)) + ` ${nativeCurrency.symbol}`
    : 'N/A'

  return `
<b>Wallet Freeze Detected on ${network}</b>

<b>Token:</b> ${tokenAddress.slice(0, 10)}...${tokenAddress.slice(-6)}
<b>Frozen Address:</b> ${frozenAddress.slice(0, 10)}...${frozenAddress.slice(-6)}
<b>TX:</b> ${explorerBase}/tx/${tx.hash}
<b>Value Involved:</b> ${valueStr}

The issuer appears to have restricted this address. Monitor for further activity.
  `.trim();
}

export function formatDrainerAlert(
  tx: any,
  network: string,
  explorerBase: string,
  drainerAddress: string,
  victimAddress: string,
  amount: string,
  nativeCurrency: { symbol: string; decimals: number }
) {
  const formattedAmount = amount || 'N/A'
  return `
<b>Drainer Activity Detected on ${network}</b>

<b>Drainer Address:</b> ${drainerAddress.slice(0, 10)}...${drainerAddress.slice(-6)}
<b>Victim Address:</b> ${victimAddress.slice(0, 10)}...${victimAddress.slice(-6)}
<b>Amount Drained:</b> ${formattedAmount} ${nativeCurrency.symbol}
<b>TX:</b> ${explorerBase}/tx/${tx.hash}

Funds appear to be moved through a drainer pattern. Exercise caution.
  `.trim();
}

export function formatDeFiAlert(
  tx: any,
  network: string,
  explorerBase: string,
  event_type: string,
  protocol: string,
  amount: string,
  nativeCurrency: { symbol: string; decimals: number }
) {
  const formattedAmount = amount || 'N/A'
  return `
<b>DeFi Activity on ${network}</b>

<b>Protocol:</b> ${protocol}
<b>Event:</b> ${event_type}
<b>Amount:</b> ${formattedAmount} ${nativeCurrency.symbol}
<b>TX:</b> ${explorerBase}/tx/${tx.hash}

DeFi activity detected. View details on the explorer.
  `.trim();
}

export async function postTwitterAlert(message: string): Promise<{ ok: boolean; tweetId?: string; error?: string }> {
  if (!process.env.NEXT_PUBLIC_TWITTER_POST_URL) return { ok: false, error: 'Twitter posting not configured' }
  try {
    const res = await fetch(process.env.NEXT_PUBLIC_TWITTER_POST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: text.slice(0, 200) }
    }
    const data = await res.json()
    return { ok: true, tweetId: data.id || data.data?.id }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}
