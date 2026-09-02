export type AlertEventType =
  | 'freeze'
  | 'drainer'
  | 'swap'
  | 'lend'
  | 'borrow'
  | 'large_transfer'
  | 'suspicious_pattern'
  | 'token_transfer'
  | 'nft_transfer'
  | 'contract_call'

export const DEFAULT_ALERT_TYPES: AlertEventType[] = ['large_transfer', 'freeze', 'drainer', 'swap']
