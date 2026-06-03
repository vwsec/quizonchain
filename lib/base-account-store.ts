type Listener = () => void

let provider: any = null
let walletClient: any = null
const listeners = new Set<Listener>()

function notify() {
  for (const fn of listeners) {
    try { fn() } catch {}
  }
}

export function subscribeBaseAccount(listener: Listener): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function setBaseAccountProvider(p: any, wc: any) {
  provider = p
  walletClient = wc
  notify()
}

export function getBaseAccountProvider(): any {
  return provider
}

export function getBaseAccountWalletClient(): any {
  return walletClient
}

export function getBaseAccountSnapshot(): boolean {
  return provider !== null
}

export function clearBaseAccount() {
  provider = null
  walletClient = null
  notify()
}
