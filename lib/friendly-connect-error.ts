// Friendly wallet-connection errors for UI display.
//
// Rejection (EIP-1193 4001, viem UserRejectedRequestError, nested cause)
// → short "User rejected the request". Anything else → truncated raw message
// (raw viem messages leak internals like the viem version — never show them
// verbatim; truncation is a backstop, not a sanitizer).
export function isUserRejection(err: unknown): boolean {
  let cur: unknown = err
  const seen = new Set<unknown>()
  while (cur && typeof cur === 'object' && !seen.has(cur)) {
    seen.add(cur)
    const rec = cur as { code?: unknown; message?: unknown; shortMessage?: unknown; cause?: unknown }
    const msg =
      typeof rec.message === 'string'
        ? rec.message
        : typeof rec.shortMessage === 'string'
          ? rec.shortMessage
          : ''
    if (rec.code === 4001 || /user rejected|rejected the request|denied|request rejected/i.test(msg)) {
      return true
    }
    cur = rec.cause
  }
  return false
}

export function friendlyConnectError(err: unknown): string {
  if (isUserRejection(err)) {
    return 'User rejected the request'
  }
  const raw = err instanceof Error ? err.message : 'Sign in failed'
  return raw.length > 120 ? raw.slice(0, 117) + '…' : raw
}
