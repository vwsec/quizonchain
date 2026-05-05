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

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send Telegram message');
    }
    return data;
  } catch (error: any) {
    console.error('Error sending Telegram message:', error);
    throw error;
  }
}

export function formatTxAlertMessage(tx: any, network: string, explorerBase: string) {
  const value = tx.value ? (Number(BigInt(tx.value)) / 1e18).toFixed(4) : '0';
  const type = tx.transaction_types?.join(', ') || 'Transaction';
  const hash = tx.hash;
  const from = tx.from?.hash ? `${tx.from.hash.slice(0, 6)}...${tx.from.hash.slice(-4)}` : 'Unknown';
  const to = tx.to?.hash ? `${tx.to.hash.slice(0, 6)}...${tx.to.hash.slice(-4)}` : 'Contract Creation';

  return `
<b>🚨 New High-Value Transaction on ${network}</b>

<b>Type:</b> ${type}
<b>Value:</b> ${value} ETH
<b>From:</b> <code>${from}</code>
<b>To:</b> <code>${to}</code>

<a href="${explorerBase}/tx/${hash}">View on Explorer</a>
  `.trim();
}
