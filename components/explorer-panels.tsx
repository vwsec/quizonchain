"use client"

// Presentational overlay panels for the bubble explorer:
// transaction detail overlay, address panel, block panel, legend, copy button.
// Extracted from the original 2,149-line bubble-explorer.tsx.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Copy,
  Check,
  ExternalLink,
  Share2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  formatNativeValue,
  timeAgo,
  truncateString,
  type ChainConfig,
  type ChainType,
} from '@/lib/explorer-config'

export function CopyButton({ text, className }: { text: string, className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button onClick={handleCopy} className={cn("p-1 hover:bg-white/10 rounded transition-colors", className)} title="Copy to clipboard">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-white" />}
    </button>
  )
}

function LegendItem({ color, label, isBase }: { color: string, label: string, isBase?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 pointer-events-auto">
      <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: color }} />
      <span className={`text-[10px] font-black uppercase tracking-widest ${isBase ? 'text-black/40' : 'text-gray-400'}`}>{label}</span>
    </div>
  )
}

export function Legend({
  config,
  isBase,
  isMegaEth,
  isSoneium,
}: {
  config: ChainConfig
  isBase: boolean
  isMegaEth: boolean
  isSoneium: boolean
}) {
  return (
    <div className={`absolute bottom-8 right-8 z-20 flex gap-4 p-3 border shadow-lg pointer-events-none ${
      isMegaEth
        ? 'bg-black border-white/10 rounded-none'
        : isBase
          ? 'bg-white border-black/5 rounded-full shadow-xl'
          : isSoneium
            ? 'bg-white/[0.03] border-[#0047FF]/20 backdrop-blur-xl rounded-full shadow-[0_0_30px_rgba(0,71,255,0.1)]'
            : 'bg-white/[0.02] border-white/[0.08] backdrop-blur-md rounded-full shadow-2xl'
    }`}>
      <LegendItem color={config.color} label="Native Transfer" isBase={isBase} />
      <LegendItem color="#22c55e" label="Contract Call" isBase={isBase} />
      <LegendItem color="#f97316" label="Token Transfer" isBase={isBase} />
      <LegendItem color="#a855f7" label="NFT Transfer" isBase={isBase} />
    </div>
  )
}

export function TransactionDetailOverlay({
  data,
  config,
  chain,
  isBase,
  isLitvm,
  onBack,
  onClose,
}: {
  data: any
  config: ChainConfig
  chain: ChainType
  isBase: boolean
  isLitvm: boolean
  onBack: () => void
  onClose: () => void
}) {
  const router = useRouter()

  return (
    <div className="w-full max-w-4xl bg-[#0e0f18] border border-white/10 rounded-2xl md:rounded-[40px] shadow-2xl relative min-h-[650px] flex flex-col overflow-hidden transition-all duration-300"
      style={!isBase ? { boxShadow: isLitvm ? '0 0 60px rgba(0,242,254,0.05), 0 25px 80px rgba(0,0,0,0.5)' : '0 25px 80px rgba(0,0,0,0.5), 0 0 60px ' + config.color + '05' } : {}}
    >
       <div className="p-4 md:p-8">
         <div className="flex justify-between items-start mb-10">
           <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-white tracking-tighter flex items-center gap-3">
                 Transaction Details
                 <span className={`text-[10px] uppercase tracking-[0.2em] font-black px-3 py-1 rounded-full border ${
                   (data.result === 'success' || data.status === 'ok')
                     ? 'bg-green-500/10 text-green-400 border-green-500/20'
                     : 'bg-red-500/10 text-red-400 border-red-500/20'
                 }`}>
                   {data.result === 'success' || data.status === 'ok' ? '✓ Confirmed' : '⚠ Failed'}
                 </span>
              </h2>
              <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest">
                 <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {timeAgo(data.timestamp)}</span>
                 <span className="text-white/10">|</span>
                 <span className="text-green-400 font-mono">#{data.block_number || data.block}</span>
              </div>
           </div>
            <button
               onClick={onClose}
               aria-label="Close"
               className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5 group"
            >
              <X className="w-6 h-6 text-gray-400 group-hover:text-white" />
           </button>
         </div>

         <div className="space-y-6">
           {/* Hashes Section */}
           <div className="grid gap-4">
              <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl group hover:border-white/10 transition-colors">
                 <span className="block text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 mb-3">Transaction Hash</span>
                 <div className="flex items-center justify-between gap-4">
                    <span className="text-base font-mono text-gray-200 tracking-tight break-all leading-relaxed">{data.hash}</span>
                    <CopyButton text={data.hash} />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div
                   onClick={() => router.push(`/explorer/${chain}/${data.from.hash}`)}
                   className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl cursor-pointer hover:bg-white/[0.05] hover:border-white/20 transition-all group"
                 >
                    <span className="block text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 mb-2">From</span>
                    <div className="flex items-center justify-between">
                       <span className="text-sm font-mono text-gray-400 truncate">{truncateString(data.from.hash, 12)}</span>
                       <CopyButton text={data.from.hash} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                 </div>
                 <div
                   onClick={() => {
                     const targetHash = data.to?.hash || data.created_contract?.hash
                     if (targetHash) router.push(`/explorer/${chain}/${targetHash}`)
                   }}
                   className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl cursor-pointer hover:bg-white/[0.05] hover:border-white/20 transition-all group"
                 >
                    <span className="block text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 mb-2">
                      {data.to ? 'To' : (data.created_contract ? 'Created Contract' : 'To')}
                    </span>
                    <div className="flex items-center justify-between">
                       <span className="text-sm font-mono text-gray-400 truncate">
                         {data.to
                           ? truncateString(data.to.hash, 12)
                           : (data.created_contract ? truncateString(data.created_contract.hash, 12) : 'Contract Creation')
                         }
                       </span>
                       {(data.to?.hash || data.created_contract?.hash) && (
                         <CopyButton
                           text={data.to?.hash || data.created_contract?.hash}
                           className="opacity-0 group-hover:opacity-100 transition-opacity"
                         />
                       )}
                    </div>
                 </div>
              </div>
           </div>

           {/* Details Grid */}
           <div className="bg-white/[0.02] border border-white/5 rounded-[32px] overflow-hidden divide-y divide-white/5">
              <div className="grid grid-cols-1 md:grid-cols-2 p-4 md:p-6 gap-4 md:gap-12">
                 <div className="space-y-1">
                    <span className="block text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 mb-1">Value</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white tracking-tighter">
                           {parseFloat(formatNativeValue(data.value || '0', config.decimals)).toFixed(4)}
                        </span>
                        <span className="text-sm text-gray-600 font-bold uppercase tracking-widest">{config.currency}</span>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <span className="block text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 mb-1">Fee paid</span>
                    <div className="flex items-baseline gap-2">
                       <span className="text-xl font-bold text-gray-400 tracking-tight">
                          {formatNativeValue(data.fee?.value || BigInt(data.gas_used || 0) * BigInt(data.gas_price || 0), config.decimals)}
                        </span>
                        <span className="text-xs text-gray-600 font-bold uppercase tracking-widest">{config.currency}</span>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-3 p-6 gap-4 bg-white/[0.01]">
                 <div className="space-y-1">
                    <span className="block text-[10px] uppercase tracking-widest font-bold text-gray-600">Gas Used</span>
                    <span className="text-sm font-mono text-gray-300">{Number(data.gas_used).toLocaleString()}</span>
                 </div>
                 <div className="space-y-1">
                    <span className="block text-[10px] uppercase tracking-widest font-bold text-gray-600">Gas Price</span>
                    <span className="text-sm font-mono text-gray-300">{(Number(data.gas_price) / 1e9).toFixed(6)} <span className="text-[10px] text-gray-500">Gwei</span></span>
                 </div>
                 <div className="space-y-1">
                    <span className="block text-[10px] uppercase tracking-widest font-bold text-gray-600">Type</span>
                    <span className="text-sm font-black text-white uppercase tracking-tighter" style={{ color: config.color }}>{data.transaction_types?.[0]?.replace('_', ' ') || 'Transfer'}</span>
                 </div>
              </div>
           </div>

           {/* Actions Footer */}
           <div className="flex flex-col gap-5 pt-4">
              <div className="flex gap-4">
                 <button
                    onClick={() => {
                       const focusAddr = data.to?.hash || data.from.hash
                       router.push(`/explorer/${chain}/${focusAddr}`)
                    }}
                    className="flex-1 py-4 bg-white text-black font-black rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 text-sm shadow-xl"
                 >
                    View Address <ExternalLink className="w-4 h-4" />
                 </button>
                 <button
                   onClick={onBack}
                   className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all text-sm"
                 >
                    Back
                 </button>
              </div>

              <div className="flex justify-center border-t border-white/5 pt-5">
                 <a
                    href={`${config.explorer}/tx/${data.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] uppercase tracking-widest font-black text-gray-600 hover:text-white transition-colors flex items-center gap-2"
                 >
                    Review on {config.name} Blockscout <ExternalLink className="w-3 h-3" />
                 </a>
              </div>
           </div>
         </div>
       </div>
    </div>
  )
}

export function AddressPanel({
  data,
  config,
  onClose,
}: {
  data: any
  config: ChainConfig
  onClose: () => void
}) {
  return (
    <div className="absolute top-[210px] md:top-[230px] right-4 md:right-8 left-4 md:left-auto w-auto md:w-80 bg-[#0d0e15]/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl p-5 pointer-events-auto z-30">
         <div className="flex justify-between items-start mb-5">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2 tracking-tight">
                Address Details
                {data.is_contract ? (
                  <span className="bg-purple-500/20 border border-purple-500/30 shadow-sm text-purple-400 px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest">Contract</span>
                ) : (
                  <span
                    className="border shadow-sm px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest opacity-90"
                    style={{
                      backgroundColor: `${config.color}33`,
                      borderColor: `${config.color}44`,
                      color: config.color
                    }}
                  >
                    Wallet
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-1">
                <span className="text-xs font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded shadow-inner">{truncateString(data.hash, 10)}</span>
                <CopyButton text={data.hash} />
              </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                   onClick={() => {
                     navigator.clipboard.writeText(window.location.href)
                     toast.success('Explorer URL copied to clipboard!')
                   }}
                   className="p-2 hover:bg-white/10 rounded-md transition-colors border border-white/5 hover:border-white/10"
                   title="Share Explorer"
                >
                  <Share2 className="w-4 h-4 text-gray-400 hover:text-white" />
                </button>
                 <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-md transition-colors border border-transparent hover:border-white/10" aria-label="Close">
                   <X className="w-4 h-4 text-gray-400" />
                </button>
             </div>
         </div>

         <div className="space-y-4">
           <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{config.currency} Balance</span>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-mono text-white font-extrabold tracking-tighter">
                  {parseFloat(formatNativeValue(data.coin_balance || '0', config.decimals)).toFixed(4)}
                </span>
                <span className="text-sm font-bold text-gray-500 mb-1">{config.currency}</span>
             </div>
           </div>

           <div className="grid grid-cols-2 gap-3 pt-2">
             <div className="flex flex-col bg-white/[0.02] border border-white/5 p-3 rounded-xl">
               <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider mb-1">Total Txs</span>
               <span className="text-base font-mono text-white tracking-tight">{data.counters?.transactions_count || '-'}</span>
             </div>
             <div className="flex flex-col bg-white/[0.02] border border-white/5 p-3 rounded-xl">
               <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider mb-1">Tokens</span>
               <span className="text-base font-mono text-white tracking-tight">{data.counters?.token_transfers_count || '-'}</span>
             </div>
           </div>

           <button
             onClick={() => window.open(`${config.explorer}/address/${data.hash}`, '_blank')}
             className="w-full mt-2 py-3 bg-white/10 hover:bg-white/90 hover:text-black transition-colors rounded-xl text-sm font-bold text-white flex justify-center items-center gap-2 border border-white/5"
           >
             View on Explorer <ExternalLink className="w-3.5 h-3.5" />
           </button>
         </div>
    </div>
  )
}

export function BlockPanel({
  data,
  config,
  onClose,
}: {
  data: any
  config: ChainConfig
  onClose: () => void
}) {
  return (
    <div className="absolute top-[60px] left-0 right-0 bg-[#0d0e15]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl p-5 pointer-events-auto z-50">
      <div className="flex justify-between items-start mb-4">
         <h3 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
           Block <span className="text-gray-400 font-mono text-base">#{data.height}</span>
         </h3>
         <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-md transition-colors border border-transparent hover:border-white/10" aria-label="Close">
            <X className="w-4 h-4 text-gray-400" />
         </button>
      </div>
      <div className="space-y-3 bg-white/[0.02] p-4 font-medium border border-white/5 rounded-xl">
        <div className="flex justify-between items-center gap-4">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Miner</span>
          <div className="flex items-center gap-1">
            <span className="text-sm font-mono text-gray-200">{truncateString(data.miner?.hash, 10)}</span>
            {data.miner?.hash && <CopyButton text={data.miner.hash} />}
          </div>
        </div>
        <div className="flex justify-between items-baseline gap-4">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Transactions</span>
          <span className="text-sm font-mono text-white font-bold">{data.tx_count}</span>
        </div>
        <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-white/5">
          <div className="flex justify-between">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest whitespace-nowrap">Gas Usage</span>
            <span className="text-[10px] uppercase font-bold text-gray-400 font-mono">
             {((Number(data.gas_used) / Number(data.gas_limit)) * 100).toFixed(2)}%
            </span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden shadow-inner border border-white/5">
             <div
               className="h-full rounded-full"
               style={{
                 backgroundColor: config.color,
                 width: `${(Number(data.gas_used) / Number(data.gas_limit)) * 100}%`
               }}
             />
          </div>
        </div>
        <div className="flex justify-between items-baseline gap-4 pt-2 mt-2 border-t border-white/5">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">Timestamp</span>
          <span className="text-xs text-gray-400">{new Date(data.timestamp).toLocaleString()}</span>
        </div>
      </div>
      <button
        onClick={() => window.open(`${config.explorer}/block/${data.height}`, '_blank')}
        className="w-full mt-4 py-2.5 hover:bg-white transition-colors hover:text-black bg-white/10 rounded-xl text-sm font-bold text-white flex justify-center items-center gap-2"
      >
        View on Explorer <ExternalLink className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
