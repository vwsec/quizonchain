"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Image from "next/image"
import { useAccount, useChainId, usePublicClient, useWalletClient } from "wagmi"
import { type Address, isAddress } from "viem"
import { NFT_CONTRACTS, NFT_ABI } from "@/lib/nft-contracts"
import { quizScoresAbi } from "@/lib/submitScore"

// ─── Chain helpers ────────────────────────────────────────────────────────────

import { activeChainConfig, isMultiChain } from "@/lib/active-chain-config"

const isMegaEth = activeChainConfig.name === 'MegaETH'
const isInk = activeChainConfig.name === 'Ink'
const isUnichain = activeChainConfig.name === 'Unichain'
const isBase = activeChainConfig.name === 'Base'
const isSoneium = activeChainConfig.name === 'Soneium'

function getChainName(chainId: number): string {
  if (!isMultiChain) return activeChainConfig.name
  if (chainId === 1868) return "Soneium"
  if (chainId === 57073) return "Ink"
  if (chainId === 8453) return "Base"
  if (chainId === 130) return "Unichain"
  if (chainId === 4326) return "MegaETH"
  if (chainId === 4441) return "LitVM LiteForge"
  return "Unknown Chain"
}

function getQuizContractAddress(chainId: number): Address | null {
  if (!isMultiChain) return activeChainConfig.contractAddress as Address
  const map: Record<number, string | undefined> = {
    1868: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET,
    57073: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_INK_MAINNET,
     8453: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_BASE_MAINNET,
     130: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNICHAIN,
     4326: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MEGAETH,
     4441: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_LITVM,
   }
  const raw = map[chainId]
  if (!raw || !isAddress(raw)) return null
  return raw as Address
}

function getNFTContractAddress(chainId: number): Address | null {
  if (!isMultiChain) return activeChainConfig.nftContract as Address
  const raw = NFT_CONTRACTS[chainId]
  if (!raw || !isAddress(raw)) return null
  return raw as Address
}

function getExplorerTxUrl(chainId: number, txHash: string): string {
  if (chainId === 1868) return `https://soneium.blockscout.com/tx/${txHash}`
  if (chainId === 57073) return `https://explorer.inkonchain.com/tx/${txHash}`
  if (chainId === 8453) return `https://basescan.org/tx/${txHash}`
  if (chainId === 130) return `https://uniscan.xyz/tx/${txHash}`
  if (chainId === 4326) return `https://megaexplorer.xyz/tx/${txHash}`
  if (chainId === 4441) return `https://liteforge.explorer.caldera.xyz/tx/${txHash}`
  return `#`
}

function getOpenSeaUrl(chainId: number, contractAddress: string, tokenId: string): string {
  // OpenSea collection URLs per chain
  if (chainId === 8453) return `https://opensea.io/assets/base/${contractAddress}/${tokenId}`
  // For other chains not natively on OpenSea, link to the explorer NFT page
  if (chainId === 1868) return `https://soneium.blockscout.com/token/${contractAddress}/instance/${tokenId}`
  if (chainId === 57073) return `https://explorer.inkonchain.com/token/${contractAddress}/instance/${tokenId}`
  if (chainId === 130) return `https://uniscan.xyz/token/${contractAddress}/instance/${tokenId}`
  if (chainId === 4326) return `https://megaexplorer.xyz/token/${contractAddress}/instance/${tokenId}`
  if (chainId === 4441) return `https://liteforge.explorer.caldera.xyz/token/${process.env.NEXT_PUBLIC_NFT_CONTRACT_LITVM}/instance/${tokenId}`
  return `https://opensea.io/assets/${contractAddress}/${tokenId}`
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const COLORS = isMegaEth 
      ? ["#00ff88", "#FFFFFF", "#000000", "#333333"] 
      : isInk 
        ? ["#7B61FF", "#FFFFFF", "#000000", "#7B61FF"]
        : isUnichain
          ? ["#FF007A", "#FFFFFF", "#000000", "#FF007A"]
        : isBase
          ? ["#0052FF", "#FFFFFF", "#0000FF", "#3C8AFF"]
        : isSoneium
          ? ["#0047FF", "#FFFFFF", "#0000FF", "#0047FF"]
          : ["#FFD700", "#FFA500", "#FFFFFF", "#0047FF", "#9B59B6"]
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 100,
      w: 6 + Math.random() * 8,
      h: 3 + Math.random() * 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      speed: 2 + Math.random() * 4,
      drift: (Math.random() - 0.5) * 2,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
    }))

    let frameId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        ctx.save()
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        ctx.globalAlpha = 0.85
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
        p.y += p.speed
        p.x += p.drift
        p.rotation += p.rotSpeed
        if (p.y > canvas.height + 20) {
          p.y = -20
          p.x = Math.random() * canvas.width
        }
      }
      frameId = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(frameId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full rounded-2xl"
    />
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

type MintState = "idle" | "pending" | "confirmed" | "failed"

interface NftMintState {
  points: bigint
  canMint: boolean
  hasMinted: boolean
  totalMinted: bigint
  mintedTokenId: string | null
  loading: boolean
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NftMintModal() {
  const [open, setOpen] = useState(false)
  const [mintState, setMintState] = useState<MintState>("idle")
  const [txHash, setTxHash] = useState<string>()
  const [txError, setTxError] = useState<string>()
  const [mintedTokenId, setMintedTokenId] = useState<string>()

  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [nftState, setNftState] = useState<NftMintState>({
    points: BigInt(0),
    canMint: false,
    hasMinted: false,
    totalMinted: BigInt(0),
    mintedTokenId: null,
    loading: true,
  })

  const THRESHOLD = BigInt(100)
  const chainName = getChainName(chainId)
  const nftContract = getNFTContractAddress(chainId)
  const quizContract = getQuizContractAddress(chainId)

  // ── Fetch on-chain state ─────────────────────────────────────────────────
  const fetchState = useCallback(async () => {
    if (!address || !publicClient || !nftContract || !quizContract) {
      setNftState((s) => ({ ...s, loading: false }))
      return
    }

    setNftState((s) => ({ ...s, loading: true }))

    try {
      const [points, canMintRaw, hasMinted, totalMinted] = await Promise.all([
        publicClient.readContract({
          address: quizContract,
          abi: quizScoresAbi,
          functionName: "totalPoints",
          args: [address],
        }) as Promise<bigint>,
        publicClient.readContract({
          address: nftContract,
          abi: NFT_ABI,
          functionName: "canMint",
          args: [address],
        }) as Promise<boolean>,
        publicClient.readContract({
          address: nftContract,
          abi: NFT_ABI,
          functionName: "hasMinted",
          args: [address],
        }) as Promise<boolean>,
        publicClient.readContract({
          address: nftContract,
          abi: NFT_ABI,
          functionName: "totalMinted",
          args: [],
        }) as Promise<bigint>,
      ])

      setNftState({
        points,
        canMint: canMintRaw,
        hasMinted,
        totalMinted,
        mintedTokenId: null,
        loading: false,
      })
    } catch {
      setNftState((s) => ({ ...s, loading: false }))
    }
  }, [address, publicClient, nftContract, quizContract])

  useEffect(() => {
    void fetchState()
  }, [fetchState])

  // ── Derived values ───────────────────────────────────────────────────────
  const isEligible = nftState.points >= THRESHOLD
  const progress = Math.min(100, Number(nftState.points))

  // Show badge when eligible and not yet minted
  const showBadge = isConnected && !nftState.loading && isEligible && !nftState.hasMinted

  // ── Mint handler ─────────────────────────────────────────────────────────
  const handleMint = async () => {
    if (!walletClient || !publicClient || !nftContract || !address) return

    setMintState("pending")
    setTxHash(undefined)
    setTxError(undefined)

    try {
      const hash = await walletClient.writeContract({
        address: nftContract,
        abi: NFT_ABI,
        functionName: "mint",
        account: address as Address,
      })

      setTxHash(hash)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      // Try to extract tokenId from Transfer event log (topic[3] = tokenId)
      const transferLog = receipt.logs.find(
        (l) =>
          l.topics[0] ===
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
      )
      if (transferLog?.topics[3]) {
        const tokenId = BigInt(transferLog.topics[3]).toString()
        setMintedTokenId(tokenId)
      }

      setMintState("confirmed")
      void fetchState()
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Transaction failed"
      setTxError(
        msg.length > 120 ? msg.slice(0, 117) + "…" : msg
      )
      setMintState("failed")
    }
  }

  // ── Close / reset ────────────────────────────────────────────────────────
  const handleClose = () => {
    setOpen(false)
    if (mintState === "confirmed" || mintState === "failed") {
      setMintState("idle")
      setTxHash(undefined)
      setTxError(undefined)
    }
  }

  // ── Badge trigger ────────────────────────────────────────────────────────
  const BadgeTrigger = ({ className = "" }: { className?: string }) =>
    showBadge ? (
      <button
        onClick={() => setOpen(true)}
        className={`relative flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 ${className} ${
          isMegaEth 
            ? 'rounded-none bg-[#00ff88] text-black px-3 py-1.5 text-xs font-mono font-bold uppercase' 
            : isInk
              ? 'rounded-full bg-[#7B61FF] text-white px-3 py-1.5 text-xs font-bold'
            : isUnichain
              ? 'rounded-2xl bg-[#FF007A] text-white px-3 py-1.5 text-xs font-bold'
            : isBase
              ? 'rounded-full bg-[#0052FF] text-white px-3 py-1.5 text-xs font-bold'
            : 'rounded-full px-3 py-1.5 text-xs font-bold text-black'
        }`}
        style={(!isMegaEth && !isInk && !isUnichain && !isBase) ? {
          background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
          boxShadow: "0 0 12px rgba(255,215,0,0.7), 0 0 24px rgba(255,215,0,0.35)",
          animation: "nftPulse 2s ease-in-out infinite",
        } : isBase ? {
          animation: "nftPulse 2s ease-in-out infinite",
        } : {}}
      >
        <span>🏆</span>
        <span>{isMegaEth ? 'CLAIM NFT' : 'Claim NFT'}</span>
        {(!isMegaEth && !isInk && !isUnichain) && (
          <span
            className="absolute -right-1 -top-1 flex h-2.5 w-2.5 items-center justify-center"
            aria-hidden
          >
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${isBase ? 'bg-white' : 'bg-[#FFD700]'}`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${isBase ? 'bg-white' : 'bg-[#FFD700]'}`} />
          </span>
        )}
      </button>
    ) : null

  return (
    <>
      {/* Global keyframe injected once */}
      <style>{`
        @keyframes nftPulse {
          0%, 100% { 
            box-shadow: ${isBase ? '0 0 12px rgba(0,82,255,0.4), 0 0 24px rgba(0,82,255,0.2)' : '0 0 12px rgba(255,215,0,0.7), 0 0 24px rgba(255,215,0,0.35)'}; 
          }
          50% { 
            box-shadow: ${isBase ? '0 0 20px rgba(0,82,255,0.6), 0 0 40px rgba(0,82,255,0.4)' : '0 0 20px rgba(255,215,0,0.9), 0 0 40px rgba(255,215,0,0.55)'}; 
          }
        }
        @keyframes goldGlow {
          0%, 100% { 
            filter: drop-shadow(0 0 12px ${isBase ? 'rgba(0,82,255,0.3)' : 'rgba(255,215,0,0.5)'}); 
          }
          50% { 
            filter: drop-shadow(0 0 28px ${isBase ? 'rgba(0,82,255,0.6)' : 'rgba(255,215,0,0.9)'}); 
          }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* ── Navbar badge (exported for use in header) ── */}
      <BadgeTrigger className="ml-1" />

      {/* ── Modal overlay ────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(12px)", background: "rgba(0,0,0,0.75)" }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div
            className={`relative w-full max-w-md overflow-hidden text-white ${
              isMegaEth 
                ? 'bg-black border border-white/20 rounded-none' 
                : isInk
                  ? 'bg-[#0A0A0F] border border-white/10 rounded-3xl'
                : isUnichain
                  ? 'bg-[#0A0A0F] border border-white/10 rounded-2xl'
                : 'rounded-2xl border border-white/10'
            }`}
            style={(!isMegaEth && !isInk && !isUnichain) ? {
              background:
                "linear-gradient(145deg, rgba(20,20,30,0.95) 0%, rgba(15,15,25,0.98) 100%)",
              boxShadow:
                "0 0 0 1px rgba(255,215,0,0.15), 0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(255,215,0,0.08)",
              animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards",
            } : { animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
          >
            {/* Confetti layer (only on confirmed) */}
            {mintState === "confirmed" && <ConfettiCanvas />}

            {/* Gold top border strip */}
            <div
              className="absolute inset-x-0 top-0 h-[2px]"
              style={{
                background: isMegaEth
                  ? "#00ff88"
                  : isInk
                    ? "#7B61FF"
                  : isUnichain
                    ? "#FF007A"
                  : "linear-gradient(90deg, transparent, #FFD700, #FFA500, #FFD700, transparent)",
              }}
            />

            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              ✕
            </button>

            <div className="relative z-10 px-6 pb-8 pt-6">
              {/* NFT Image */}
              <div className="mb-5 flex justify-center">
                <div
                  className={`relative h-44 w-44 overflow-hidden border ${isMegaEth ? 'rounded-none border-[#00ff88]/30' : isInk ? 'rounded-3xl border-[#7B61FF]/30' : isUnichain ? 'rounded-2xl border-[#FF007A]/30' : isBase ? 'rounded-2xl border-[#0052FF]/20' : 'rounded-2xl border-[rgba(255,215,0,0.3)]'}`}
                  style={{
                    animation: (isMegaEth || isInk || isUnichain || isBase) ? "" : "goldGlow 3s ease-in-out infinite",
                    boxShadow: (isMegaEth || isInk || isUnichain) ? "" : isBase ? "0 4px 20px rgba(0, 82, 255, 0.1)" : "0 0 0 1px rgba(255,215,0,0.2), 0 0 32px rgba(255,215,0,0.25)",
                  }}
                >
                  <Image
                    src={!isMultiChain ? activeChainConfig.nftImage : `/nft/${chainName.toLowerCase()}.png`}
                    alt="Quiz On Chain NFT"
                    fill
                    className="object-cover"
                    onError={(e) => {
                      // Fallback placeholder if image missing
                      const t = e.currentTarget as HTMLImageElement
                      t.style.display = "none"
                    }}
                  />
                  {/* Overlay shimmer */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(255,215,0,0.06) 0%, transparent 60%)",
                    }}
                  />
                </div>
              </div>

              {/* ── State: confirmed ──────────────────────────────────── */}
              {mintState === "confirmed" ? (
                <div className="text-center">
                  <div className="mb-2 text-4xl">🎉</div>
                  <h2 className={`mb-1 text-2xl font-bold ${isBase ? 'text-black tracking-tighter' : 'text-white'}`}>NFT Minted!</h2>
                  <p className={`mb-5 text-sm text-balance ${isBase ? 'text-black/60' : 'text-white/60'}`}>
                    Your{" "}
                    <span className={`font-semibold ${isMegaEth ? 'text-[#00ff88]' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : isBase ? 'text-[#0052FF]' : 'text-[#FFD700]'}`}>
                      Quiz On Chain — Master
                    </span>{" "}
                    NFT is now on-chain.
                  </p>

                  <div className="flex gap-2">
                    {txHash && (
                      <a
                        href={getExplorerTxUrl(chainId, txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex flex-1 items-center justify-center gap-1.5 border py-2.5 text-sm font-medium transition ${isBase ? 'rounded-xl border-black/5 text-black/80 hover:bg-black/5' : 'rounded-xl border-white/10 text-white/80 hover:bg-white/5'}`}
                      >
                        🔗 View TX
                      </a>
                    )}
                    {mintedTokenId && nftContract && (
                      <a
                        href={getOpenSeaUrl(chainId, nftContract, mintedTokenId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-bold transition ${isMegaEth ? 'rounded-none border border-[#00ff88]/50 hover:bg-[#00ff88]/10 text-[#00ff88]' : isInk ? 'rounded-full border border-[#7B61FF]/30 hover:bg-[#7B61FF]/10 text-[#7B61FF]' : isUnichain ? 'rounded-2xl border border-[#FF007A]/30 hover:bg-[#FF007A]/10 text-[#FF007A]' : isBase ? 'rounded-xl border border-[#0052FF]/30 hover:bg-[#0052FF]/5 text-[#0052FF]' : isSoneium ? 'rounded-xl border border-[#0047FF]/30 hover:bg-[#0047FF]/5 text-[#0047FF]' : 'rounded-xl border border-[rgba(255,215,0,0.3)] hover:bg-[rgba(255,215,0,0.08)]'}`}
                        style={(!isMegaEth && !isInk && !isUnichain && !isBase && !isSoneium) ? { color: "#FFD700" } : {}}
                      >
                        🌊 View NFT
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* ── Title ─────────────────────────────────────────── */}
                  <div className="mb-1 text-center">
                    <h2 className={`text-2xl font-bold ${isBase ? 'text-black tracking-tighter' : 'text-white'}`}>
                      {nftState.hasMinted ? "Already Claimed ✅" : "You've Earned It!"}
                    </h2>
                    <p className={`mt-1 text-sm ${isBase ? 'text-black/45' : 'text-white/55'}`}>
                      {nftState.hasMinted
                        ? "You've already claimed your exclusive NFT."
                        : isEligible
                          ? "You reached 100 points — claim your exclusive Quiz On Chain NFT"
                          : "You need 100 total points to unlock this NFT"}
                    </p>
                  </div>

                  {/* ── Stats row ─────────────────────────────────────── */}
                  <div className="mt-4 flex gap-1.5 md:gap-2">
                    <div className={`flex flex-1 flex-col items-center py-3 border ${
                      isMegaEth ? 'bg-black border-white/15 rounded-none' : isBase ? 'rounded-xl border-black/5 bg-black/5' : 'rounded-xl border-white/[0.07] bg-white/[0.04]'
                    }`}>
                      <span
                        className={`text-xl font-bold ${isMegaEth ? 'font-mono' : ''}`}
                        style={{ color: isMegaEth ? "#00ff88" : isInk ? "#7B61FF" : isUnichain ? "#FF007A" : isBase ? "#0052FF" : isSoneium ? "#0047FF" : "#FFD700" }}
                      >
                        {nftState.loading ? "…" : nftState.points.toString()}
                      </span>
                      <span className={`text-xs ${isMegaEth ? 'text-white/40 uppercase font-mono' : isBase ? 'text-black/40' : 'text-white/45'}`}>Your Points</span>
                    </div>
                    <div className={`flex flex-1 flex-col items-center py-3 border ${
                      isMegaEth ? 'bg-black border-white/15 rounded-none' : isBase ? 'rounded-xl border-black/5 bg-black/5' : 'rounded-xl border-white/[0.07] bg-white/[0.04]'
                    }`}>
                      <span className={`text-xl font-bold ${isMegaEth ? 'font-mono' : isBase ? 'text-black' : 'text-white'}`}>
                        {nftState.loading ? "…" : nftState.totalMinted.toString()}
                      </span>
                      <span className={`text-xs ${isMegaEth ? 'text-white/40 uppercase font-mono' : isBase ? 'text-black/40' : 'text-white/45'}`}>Total Minted</span>
                    </div>
                    <div className={`flex flex-1 flex-col items-center py-3 border ${
                      isMegaEth ? 'bg-black border-white/15 rounded-none' : isBase ? 'rounded-xl border-black/5 bg-black/5' : 'rounded-xl border-white/[0.07] bg-white/[0.04]'
                    }`}>
                      <span className={`text-xl font-bold ${isMegaEth ? 'text-[#00ff88] font-mono' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : isBase ? 'text-[#0052FF]' : isSoneium ? 'text-[#0047FF]' : 'text-blue-400'}`}>
                        {chainName}
                      </span>
                      <span className={`text-xs ${isMegaEth ? 'text-white/40 uppercase font-mono' : isBase ? 'text-black/40' : 'text-white/45'}`}>Network</span>
                    </div>
                  </div>

                  {/* ── Progress bar (only when < threshold) ──────────── */}
                  {!isEligible && !nftState.hasMinted && !nftState.loading && (
                    <div className="mt-4">
                      <div className={`mb-1.5 flex justify-between text-xs ${isMegaEth ? 'text-white/40 uppercase font-mono' : isBase ? 'text-black/40' : 'text-white/50'}`}>
                        <span>Progress to NFT</span>
                        <span>{progress} / 100 pts</span>
                      </div>
                      <div className={`h-2 w-full overflow-hidden ${isMegaEth ? 'bg-white/10 rounded-none' : isBase ? 'bg-black/5 rounded-full' : 'rounded-full bg-white/10'}`}>
                        <div
                          className={`h-full transition-all duration-700 ${isMegaEth ? 'rounded-none' : 'rounded-full'}`}
                          style={{
                            width: `${progress}%`,
                            background: isMegaEth ? "#00ff88" : isInk ? "#7B61FF" : isUnichain ? "#FF007A" : isBase ? "#0052FF" : isSoneium ? "#0047FF" : "linear-gradient(90deg, #0047FF, #FFD700)",
                          }}
                        />
                      </div>
                      <p className={`mt-3 text-center text-xs ${isMegaEth ? 'text-white/40 uppercase font-mono' : isBase ? 'text-black/40' : 'text-white/40'}`}>
                        Keep playing to unlock your NFT badge
                      </p>
                    </div>
                  )}

                  {/* ── Already minted ────────────────────────────────── */}
                  {nftState.hasMinted && (
                    <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 py-3 text-sm font-medium text-green-400">
                      <span>✅</span>
                      <span>NFT already in your wallet</span>
                    </div>
                  )}

                  {/* ── Chain label ───────────────────────────────────── */}
                  {isEligible && !nftState.hasMinted && (
                    <p className={`mt-3 text-center text-xs ${isBase ? 'text-black/40' : 'text-white/40'}`}>
                      Minting on{" "}
                      <span className={`font-semibold ${isBase ? 'text-black/70' : 'text-white/70'}`}>{chainName}</span>
                    </p>
                  )}

                  {/* ── Error ─────────────────────────────────────────── */}
                  {mintState === "failed" && txError && (
                    <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
                      ⚠️ {txError}
                    </div>
                  )}

                  {/* ── Mint button ───────────────────────────────────── */}
                  {isEligible && !nftState.hasMinted && (
                    <button
                      onClick={handleMint}
                      disabled={mintState === "pending" || !walletClient || !nftContract}
                      className={`relative mt-4 w-full overflow-hidden py-3 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
                        isMegaEth 
                          ? 'rounded-none bg-[#00ff88] text-black font-mono uppercase' 
                          : isInk
                            ? 'rounded-full bg-[#7B61FF] text-white hover:bg-[#6c54e6]'
                          : isUnichain
                            ? 'rounded-2xl bg-[#FF007A] text-white hover:bg-[#d60066]'
                          : isBase
                            ? 'rounded-xl bg-[#0052FF] text-white hover:bg-[#0047FF]'
                          : isSoneium
                            ? 'rounded-2xl bg-[#0047FF] text-white hover:bg-[#003bd9]'
                            : 'rounded-xl text-black'
                      }`}
                      style={(!isMegaEth && !isInk && !isUnichain && !isBase) ? {
                        background:
                          mintState === "pending"
                            ? "rgba(255,215,0,0.5)"
                            : "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                        boxShadow:
                          mintState !== "pending"
                            ? "0 0 20px rgba(255,215,0,0.5), 0 4px 16px rgba(255,165,0,0.3)"
                            : "none",
                      } : isBase && mintState !== "pending" ? {
                        boxShadow: "0 4px 12px rgba(0, 82, 255, 0.2)",
                      } : {}}
                    >
                      {mintState === "pending" ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg
                            className="h-4 w-4 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8H4z"
                            />
                          </svg>
                          {isMegaEth ? 'MINTING...' : 'Minting…'}
                        </span>
                      ) : !nftContract ? (
                        isMegaEth ? 'NFT NOT DEPLOYED' : "NFT not deployed on this chain"
                      ) : (
                        isMegaEth ? '🏆 MINT NFT' : "🏆 Mint NFT"
                      )}
                    </button>
                  )}

                  {/* No NFT contract on this chain */}
                  {!nftContract && (
                    <p className="mt-2 text-center text-xs text-white/30">
                      NFT minting is not available on {chainName} yet.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Standalone badge for home screen ────────────────────────────────────────

export function NftBadgeTrigger() {

  const [open, setOpen] = useState(false)
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()

  const [eligible, setEligible] = useState(false)
  const [hasMinted, setHasMinted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [points, setPoints] = useState(BigInt(0))

  const nftContract = getNFTContractAddress(chainId)
  const quizContract = getQuizContractAddress(chainId)

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      if (!address || !publicClient || !nftContract || !quizContract) {
        if (!cancelled) setLoading(false)
        return
      }
      setLoading(true)
      try {
        const [pts, minted] = await Promise.all([
          publicClient.readContract({
            address: quizContract,
            abi: quizScoresAbi,
            functionName: "totalPoints",
            args: [address],
          }) as Promise<bigint>,
          publicClient.readContract({
            address: nftContract,
            abi: NFT_ABI,
            functionName: "hasMinted",
            args: [address],
          }) as Promise<boolean>,
        ])
        if (!cancelled) {
          setPoints(pts)
          setEligible(pts >= BigInt(100))
          setHasMinted(minted)
          setLoading(false)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }
    void check()
    return () => { cancelled = true }
  }, [address, publicClient, nftContract, quizContract])

  const showBadge = isConnected && !loading && eligible && !hasMinted

  if (!showBadge) return null

  return (
    <>
      <style>{`
        @keyframes nftPulse {
          0%, 100% { box-shadow: 0 0 12px rgba(255,215,0,0.7), 0 0 24px rgba(255,215,0,0.35); }
          50% { box-shadow: 0 0 20px rgba(255,215,0,0.9), 0 0 40px rgba(255,215,0,0.55); }
        }
      `}</style>

      {/* Home-screen banner */}
      <div
        className={`mb-6 flex flex-col sm:flex-row items-center gap-3 border px-4 md:px-5 py-4 text-center sm:text-left ${
          isMegaEth ? 'bg-black border-white/20 rounded-none' : 'rounded-2xl'
        }`}
        style={(!isMegaEth && !isInk && !isUnichain) ? {
          borderColor: "rgba(255,215,0,0.25)",
          background: "rgba(255,215,0,0.06)",
        } : isInk ? {
          borderColor: "rgba(123,97,255,0.25)",
          background: "rgba(123,97,255,0.06)",
        } : isUnichain ? {
          borderColor: "rgba(255,0,122,0.25)",
          background: "rgba(255,0,122,0.06)",
        } : isBase ? {
          borderColor: "rgba(0,82,255,0.25)",
          background: "rgba(0,82,255,0.06)",
        } : {}}
      >
        <div className="text-3xl">🏆</div>
        <div>
          <p className={`text-sm font-semibold ${isBase ? 'text-black tracking-tighter' : 'text-white'} ${isMegaEth ? 'uppercase font-mono' : ''}`}>
            You've reached{" "}
            <span style={{ color: isMegaEth ? "#00ff88" : isInk ? "#7B61FF" : isUnichain ? "#FF007A" : isBase ? "#0052FF" : "#FFD700" }}>{points.toString()} points</span>!
          </p>
          <p className={`mt-0.5 text-xs ${isMegaEth ? 'text-white/40 uppercase font-mono' : isBase ? 'text-black/40' : 'text-white/50'}`}>
            You're eligible to claim your exclusive NFT badge
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className={`relative flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 ${
            isMegaEth 
              ? 'rounded-none bg-[#00ff88] text-black px-4 py-2 text-sm font-mono font-bold uppercase' 
              : `rounded-full px-4 py-2 text-sm font-bold ${isBase ? 'text-white' : 'text-black'}`
          }`}
          style={(!isMegaEth && !isInk && !isUnichain) ? {
            background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
            animation: "nftPulse 2s ease-in-out infinite",
          } : isBase ? {
            background: "#0052FF",
            animation: "nftPulse 2s ease-in-out infinite",
          } : {}}
        >
          <span>🏆</span> {isMegaEth ? 'CLAIM NFT' : 'Claim NFT'}
          {(!isMegaEth && !isInk && !isUnichain) && (
            <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${isBase ? 'bg-white' : 'bg-[#FFD700]'}`} />
              <span className={`relative inline-flex h-2 w-2 rounded-full ${isBase ? 'bg-white' : 'bg-[#FFD700]'}`} />
            </span>
          )}
        </button>
      </div>

      {/* Inline modal rendered from this trigger too */}
      {open && <NftMintModal />}
    </>
  )
}

// ─── NftProgressCard ─────────────────────────────────────────────────────────
// Glass card for the home screen stats area.
// refreshKey: increment from parent to re-fetch after a quiz submission.

interface NftProgressCardProps {
  refreshKey?: number
}

export function NftProgressCard({ refreshKey = 0 }: NftProgressCardProps) {
  const [modalOpen, setModalOpen] = useState(false)

  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()

  const nftContract = getNFTContractAddress(chainId)
  const quizContract = getQuizContractAddress(chainId)

  const [points, setPoints] = useState(BigInt(0))
  const [hasMinted, setHasMinted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])



  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!address || !publicClient || !nftContract || !quizContract) {
        if (!cancelled) setLoading(false)
        return
      }
      if (!cancelled) setLoading(true)
      try {
        const [pts, minted] = await Promise.all([
          publicClient.readContract({
            address: quizContract,
            abi: quizScoresAbi,
            functionName: "totalPoints",
            args: [address],
          }) as Promise<bigint>,
          publicClient.readContract({
            address: nftContract,
            abi: NFT_ABI,
            functionName: "hasMinted",
            args: [address],
          }) as Promise<boolean>,
        ])
        if (!cancelled) {
          setPoints(pts)
          setHasMinted(minted)
          setLoading(false)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  // refreshKey intentionally included so parent can trigger re-fetch
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, chainId, publicClient, nftContract, quizContract, refreshKey])

  // Only render if mounted, connected, and chain has both contracts deployed
  if (!mounted || !isConnected || !nftContract || !quizContract) return null

  const progress = Math.min(100, Number(points))
  const isEligible = points >= BigInt(100)

  return (
    <>
      <style>{`
        @keyframes progressShimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes holderPulse {
          0%, 100% { 
            box-shadow: ${isBase ? '0 0 8px rgba(0,82,255,0.2)' : '0 0 8px rgba(255,215,0,0.4)'}; 
          }
          50% { 
            box-shadow: ${isBase ? '0 0 18px rgba(0,82,255,0.4)' : '0 0 18px rgba(255,215,0,0.75)'}; 
          }
        }
      `}</style>

      <div
        className={`relative mt-6 w-full max-w-4xl overflow-hidden transition-all ${
          isMegaEth 
            ? 'bg-black border border-white/10 rounded-none' 
            : isInk
              ? 'backdrop-blur-md rounded-3xl border bg-white/[0.03]'
            : isUnichain
              ? 'backdrop-blur-md rounded-2xl border bg-white/[0.03]'
            : 'backdrop-blur-md rounded-2xl border'
        }`}
        style={(!isMegaEth && !isInk && !isUnichain) ? {
          borderColor: hasMinted
            ? "rgba(255,215,0,0.3)"
            : isEligible
              ? "rgba(255,215,0,0.22)"
              : "rgba(255,255,255,0.08)",
          background: hasMinted
            ? "rgba(255,215,0,0.05)"
            : isEligible
              ? "rgba(255,215,0,0.04)"
              : "rgba(255,255,255,0.03)",
        } : isInk ? {
          borderColor: "rgba(123,97,255,0.2)",
        } : isUnichain ? {
          borderColor: "rgba(255,0,122,0.2)",
        } : isBase ? {
          borderColor: "rgba(0,82,255,0.2)",
          background: "rgba(0,82,255,0.02)",
        } : {}}
      >
        {/* Accent bar */}
        <div
          className={`absolute bottom-3 left-0 top-3 w-[3px] ${isMegaEth ? 'bg-[#00ff88]' : isInk ? 'bg-[#7B61FF] rounded-r-full' : isUnichain ? 'bg-[#FF007A] rounded-r-full' : isBase ? 'bg-[#0052FF] rounded-r-full' : 'rounded-r-full'}`}
          style={(!isMegaEth && !isInk && !isUnichain && !isBase) ? { background: "linear-gradient(180deg, #FFD700, #FFA500)" } : {}}
        />

        <div className="px-5 py-4">

          {/* ── Loading ────────────────────────────────────────────── */}
          {loading && (
            <div className="flex items-center gap-3">
              <div
                className="h-4 w-4 animate-spin rounded-full border-2"
                style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: isMegaEth ? "#00ff88" : isInk ? "#7B61FF" : isUnichain ? "#FF007A" : isBase ? "#0052FF" : "#FFD700" }}
              />
              <span className="text-xs text-white/40">Checking NFT progress…</span>
            </div>
          )}

          {/* ── NFT Holder badge ───────────────────────────────────── */}
          {!loading && hasMinted && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl shrink-0">⭐</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">NFT Holder</p>
                  <p className="text-xs text-white/45 truncate">
                    You own Quiz On Chain NFT
                  </p>
                </div>
              </div>
              <span
                className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold"
                style={{
                  color: "#FFD700",
                  borderColor: isInk ? "rgba(123,97,255,0.4)" : isUnichain ? "rgba(255,0,122,0.4)" : "rgba(255,215,0,0.4)",
                  background: isInk ? "rgba(123,97,255,0.08)" : isUnichain ? "rgba(255,0,122,0.08)" : "rgba(255,215,0,0.08)",
                  animation: "holderPulse 3s ease-in-out infinite",
                }}
              >
                ⭐ NFT Holder
              </span>
            </div>
          )}

          {/* ── Progress bar (not yet eligible) ───────────────────── */}
          {!loading && !hasMinted && !isEligible && (
            <div>
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base leading-none shrink-0">🏆</span>
                  <span className={`text-sm font-medium truncate ${isBase ? 'text-black' : 'text-white'}`}>Progress to NFT</span>
                </div>
                <span className="text-xs font-semibold shrink-0" style={{ color: isMegaEth ? "#00ff88" : isInk ? "#7B61FF" : isUnichain ? "#FF007A" : isBase ? "#0052FF" : "#FFD700" }}>
                  {progress} / 100 pts
                </span>
              </div>

              {/* Track */}
              <div className={`relative h-2.5 w-full overflow-hidden rounded-full ${isBase ? 'bg-black/5' : 'bg-white/[0.08]'}`}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    minWidth: progress > 0 ? "8px" : "0",
                    background: isMegaEth ? "#00ff88" : isInk ? "#7B61FF" : isUnichain ? "#FF007A" : isBase ? "#0052FF" : "linear-gradient(90deg, #0047FF 0%, #FFD700 100%)",
                    backgroundSize: "200% 100%",
                    animation:
                      (progress > 5 && !isMegaEth && !isInk && !isUnichain)
                        ? "progressShimmer 2.5s linear infinite"
                        : undefined,
                    transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)",
                  }}
                />
              </div>

              <div className="mt-1.5 flex items-center justify-between">
                <p className={`text-[11px] ${isBase ? 'text-black/40' : 'text-white/35'}`}>
                  Each correct answer earns points — keep playing!
                </p>
                <span className={`text-[11px] ${isBase ? 'text-black/40' : 'text-white/35'}`}>{progress}%</span>
              </div>
            </div>
          )}

          {/* ── Eligible: Claim NFT button ─────────────────────────── */}
          {!loading && !hasMinted && isEligible && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xl shrink-0">🏆</span>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${isBase ? 'text-black tracking-tighter' : 'text-white'} ${isMegaEth ? 'uppercase font-mono' : ''}`}>
                    You've reached{" "}
                    <span style={{ color: isMegaEth ? "#00ff88" : isInk ? "#7B61FF" : isUnichain ? "#FF007A" : isBase ? "#0052FF" : "#FFD700" }}>{points.toString()} pts</span>!
                  </p>
                  <p className={`text-xs ${isMegaEth ? 'text-white/40 uppercase font-mono' : isBase ? 'text-black/40' : 'text-white/45'}`}>
                    You're eligible to claim your exclusive NFT
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className={`relative flex shrink-0 items-center gap-1.5 transition-all hover:scale-105 active:scale-95 self-start sm:self-auto ${
                  isMegaEth 
                    ? 'rounded-none bg-[#00ff88] text-black px-4 py-2 text-sm font-mono font-bold uppercase' 
                    : 'rounded-full px-4 py-2 text-sm font-bold text-black'
                }`}
                style={(!isMegaEth && !isInk && !isUnichain && !isBase) ? {
                  background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                  animation: "nftPulse 2s ease-in-out infinite",
                } : isBase ? {
                  background: "#0052FF",
                  color: "white",
                  boxShadow: "0 4px 12px rgba(0, 82, 255, 0.2)",
                } : {}}
              >
                🏆 {isMegaEth ? 'CLAIM NFT' : 'Claim NFT'}
                {!isMegaEth && (
                  <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${isBase ? 'bg-white' : 'bg-[#FFD700]'}`} />
                    <span className={`relative inline-flex h-2 w-2 rounded-full ${isBase ? 'bg-white' : 'bg-[#FFD700]'}`} />
                  </span>
                )}
              </button>
            </div>
          )}

        </div>
      </div>

      {modalOpen && <NftMintModal />}
    </>
  )
}

