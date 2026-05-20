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
<b>🚨 New High-Value Transaction on ${network}</b>

<b>Type:</b> ${type}
<b>Value:</b> ${value}
<b>From:</b> <code>${from}</code>
<b>To:</b> <code>${to}</code>

<a href="${explorerBase}/tx/${hash}">View on Explorer</a>
  `.trim();
}
