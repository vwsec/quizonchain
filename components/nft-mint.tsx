"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Image from "next/image"
import { useAccount, useChainId, usePublicClient, useWalletClient } from "wagmi"
import { type Address, isAddress } from "viem"
import { NFT_CONTRACTS, NFT_ABI } from "@/lib/nft-contracts"
import { quizScoresAbi } from "@/lib/submitScore"
import { useActiveChain } from "@/hooks/use-active-chain"
import { getChainConfig } from "@/lib/active-chain-config"
import { Trophy, Loader2, ExternalLink, CheckCircle, XCircle, Award, Gem } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

// ─── Chain helpers ────────────────────────────────────────────────────────

function getChainName(chainId: number): string {
  const cfg = getChainConfig(chainId)
  return cfg?.name ?? "Unknown Chain"
}

function getQuizContractAddress(chainId: number): Address | null {
  const map: Record<number, string | undefined> = {
    1868: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET,
    57073: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_INK_MAINNET,
    8453: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_BASE_MAINNET,
    130: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNICHAIN,
    4326: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MEGAETH,
    4441: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_LITVM,
    5042002: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ARC,
  }
  const raw = map[chainId]
  if (!raw || !isAddress(raw)) return null
  return raw as Address
}

function getNFTContractAddress(chainId: number): Address | null {
  const raw = NFT_CONTRACTS[chainId]
  if (!raw || !isAddress(raw)) return null
  return raw as Address
}

function getExplorerTxUrl(chainId: number, txHash: string): string {
  const urls: Record<number, string> = {
    1868: `https://soneium.blockscout.com/tx/${txHash}`,
    57073: `https://explorer.inkonchain.com/tx/${txHash}`,
    8453: `https://basescan.org/tx/${txHash}`,
    130: `https://uniscan.xyz/tx/${txHash}`,
    4326: `https://megaexplorer.xyz/tx/${txHash}`,
    4441: `https://liteforge.explorer.caldera.xyz/tx/${txHash}`,
    5042002: `https://testnet.arcscan.app/tx/${txHash}`,
  }
  return urls[chainId] ?? "#"
}

function getOpenSeaUrl(chainId: number, contractAddress: string, tokenId: string): string {
  const urls: Record<number, string> = {
    8453: `https://opensea.io/assets/base/${contractAddress}/${tokenId}`,
    1868: `https://soneium.blockscout.com/token/${contractAddress}/instance/${tokenId}`,
    57073: `https://explorer.inkonchain.com/token/${contractAddress}/instance/${tokenId}`,
    130: `https://uniscan.xyz/token/${contractAddress}/instance/${tokenId}`,
    4326: `https://megaexplorer.xyz/token/${contractAddress}/instance/${tokenId}`,
    4441: `https://liteforge.explorer.caldera.xyz/token/${process.env.NEXT_PUBLIC_NFT_CONTRACT_LITVM}/instance/${tokenId}`,
    5042002: `https://testnet.arcscan.app/token/${contractAddress}/instance/${tokenId}`,
  }
  return urls[chainId] ?? `https://opensea.io/assets/${contractAddress}/${tokenId}`
}

// ─── Chain accent helpers ─────────────────────────────────────────────────

function getAccentColor(_name?: string): string {
  return "#FBBF24"
}

function getButtonGradient(): string {
  return "linear-gradient(135deg, #FBBF24, #F59E0B)"
}

function getButtonBorderRadius(name: string | undefined): string {
  const map: Record<string, string> = {
    MegaETH: "rounded-none",
    Ink: "rounded-full",
    Unichain: "rounded-2xl",
    Base: "rounded-xl",
    Soneium: "rounded-2xl",
    LitVM: "rounded-xl",
    "Arc Testnet": "rounded-2xl",
  }
  return map[name ?? ""] ?? "rounded-xl"
}

function getBadgeBorderRadius(name: string | undefined): string {
  const map: Record<string, string> = {
    MegaETH: "rounded-none",
    Ink: "rounded-full",
    Unichain: "rounded-2xl",
    Base: "rounded-full",
    Soneium: "rounded-2xl",
    LitVM: "rounded-xl",
    "Arc Testnet": "rounded-2xl",
  }
  return map[name ?? ""] ?? "rounded-full"
}

function getContainerBorderRadius(name: string | undefined): string {
  const map: Record<string, string> = {
    MegaETH: "rounded-none",
    Ink: "rounded-2xl",
    Unichain: "rounded-2xl",
    Base: "rounded-xl",
    Soneium: "rounded-2xl",
    LitVM: "rounded-xl",
    "Arc Testnet": "rounded-2xl",
  }
  return map[name ?? ""] ?? "rounded-2xl"
}

function getChainFontClass(name: string | undefined): string {
  const map: Record<string, string> = {
    MegaETH: "font-mono uppercase",
    LitVM: "font-mono",
  }
  return map[name ?? ""] ?? ""
}

function getChainGlow(): string {
  return "inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 24px rgba(251,191,36,0.35)"
}

const THRESHOLD = BigInt(100)

type MintState = "idle" | "pending" | "confirmed" | "failed"

interface NftMintState {
  points: bigint
  canMint: boolean
  hasMinted: boolean
  totalMinted: bigint
  mintedTokenId: string | null
  loading: boolean
}

// ─── Confetti ─────────────────────────────────────────────────────────────

function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { chainConfig: cfg } = useActiveChain()
  const accent = getAccentColor(cfg?.name)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const COLORS = [accent, "#FFFFFF", "#000000", accent]
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
  }, [accent])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full rounded-2xl"
    />
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────

export function NftMintModal({ defaultOpen = false, showTrigger = true, onClose }: { defaultOpen?: boolean; showTrigger?: boolean; onClose?: () => void }) {
  const [open, setOpen] = useState(defaultOpen)
  const [mintState, setMintState] = useState<MintState>("idle")
  const [txHash, setTxHash] = useState<string>()
  const [txError, setTxError] = useState<string>()
  const [mintedTokenId, setMintedTokenId] = useState<string>()

  const { address } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { chainConfig: cfg, isConnected } = useActiveChain()

  const chainName = getChainName(chainId)
  const accent = getAccentColor(cfg?.name)
  const nftContract = getNFTContractAddress(chainId)
  const quizContract = getQuizContractAddress(chainId)

  const [nftState, setNftState] = useState<NftMintState>({
    points: BigInt(0),
    canMint: false,
    hasMinted: false,
    totalMinted: BigInt(0),
    mintedTokenId: null,
    loading: true,
  })

  // ── Fetch on-chain state ──────────────────────────────────────────────
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

  // ── Derived values ────────────────────────────────────────────────────
  const isEligible = nftState.points >= THRESHOLD
  const progress = Math.min(100, Number(nftState.points))
  const showBadge = isConnected && !nftState.loading && isEligible && !nftState.hasMinted

  // ── Mint handler ──────────────────────────────────────────────────────
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
      const msg = err instanceof Error ? err.message : "Transaction failed"
      setTxError(msg.length > 120 ? msg.slice(0, 117) + "\u2026" : msg)
      setMintState("failed")
    }
  }

  // ── Close / reset ─────────────────────────────────────────────────────
  const handleClose = () => {
    setOpen(false)
    onClose?.()
    if (mintState === "confirmed" || mintState === "failed") {
      setMintState("idle")
      setTxHash(undefined)
      setTxError(undefined)
    }
  }

  // ── Badge trigger button ──────────────────────────────────────────────
  const BadgeTrigger = ({ className = "" }: { className?: string }) =>
    showBadge ? (
      <button
        onClick={() => setOpen(true)}
          className={`relative flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#FBBF24] focus-visible:outline-none ${getBadgeBorderRadius(cfg?.name)} ${getChainFontClass(cfg?.name)} ${className}`}
        style={{
          background: getButtonGradient(),
          color: "#fff",
          boxShadow: getChainGlow(),
          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
        }}
      >
        <Trophy className="size-3.5" />
        <span>{cfg?.name === "MegaETH" ? "CLAIM NFT" : "Claim NFT"}</span>
      </button>
    ) : null

  // ── Style keyframes ───────────────────────────────────────────────────
  const keyframes = `
    @keyframes nftPulse {
      0%, 100% { box-shadow: 0 0 12px ${accent}66, 0 0 24px ${accent}33; }
      50% { box-shadow: 0 0 20px ${accent}99, 0 0 40px ${accent}55; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(24px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <>
      <style>{keyframes}</style>

      {showTrigger && <BadgeTrigger className="ml-1" />}

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
        <DialogContent
          className={`w-full max-w-md border-0 p-0 text-white bg-transparent ${getContainerBorderRadius(cfg?.name)}`}
          style={{
            background: "#0F0F23",
            backgroundImage: "linear-gradient(160deg, #0F0F23, #0F0F2B)",
            boxShadow: `0 0 0 1px ${accent}22, 0 24px 80px rgba(0,0,0,0.6)`,
            animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards",
          }}
        >
          {/* Confetti layer */}
          {mintState === "confirmed" && <ConfettiCanvas />}

        {/* Accent top strip */}
        <div
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, ${accent}, #8B5CF6)` }}
        />
        <div
          className="absolute inset-x-0 top-[2px] h-[1px]"
          style={{ background: "linear-gradient(90deg, rgba(139,92,246,0.3), transparent)" }}
        />

          <div className="px-6 pb-8 pt-6">
            {/* NFT Image */}
            <div className="mb-5 flex justify-center">
              <div
                className={`relative h-44 w-44 overflow-hidden ${getContainerBorderRadius(cfg?.name)}`}
                style={{
                  border: `1px solid ${accent}44`,
                  boxShadow: `0 0 32px ${accent}22, 0 0 60px rgba(139,92,246,0.08)`,
                }}
              >
                <Image
                  src={`/nft/${chainName.toLowerCase()}.png`}
                  alt="Quiz On Chain NFT"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const t = e.currentTarget as HTMLImageElement
                    t.style.display = "none"
                  }}
                />
              </div>
            </div>

            {/* ── State: confirmed ────────────────────────────────── */}
            {mintState === "confirmed" ? (
              <div className="text-center">
                <div className="mb-2 flex justify-center">
                  <div
                    className="flex size-14 items-center justify-center rounded-full"
                    style={{ background: `${accent}22` }}
                  >
                    <CheckCircle className="size-8" style={{ color: accent }} />
                  </div>
                </div>
                <DialogTitle className="mb-1 text-center text-2xl font-bold text-white font-display">
                  NFT Minted!
                </DialogTitle>
                <DialogDescription className="mb-5 text-balance text-sm text-white/60 font-body">
                  Your{" "}
                  <span className="font-semibold" style={{ color: accent }}>
                    Quiz On Chain — Master
                  </span>{" "}
                  NFT is now on-chain.
                </DialogDescription>

                <div className="flex gap-2">
                  {txHash && (
                    <a
                      href={getExplorerTxUrl(chainId, txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-white/80 transition-colors duration-200 hover:bg-white/5"
                    >
                      <ExternalLink className="size-4" />
                      View TX
                    </a>
                  )}
                  {mintedTokenId && nftContract && (
                    <a
                      href={getOpenSeaUrl(chainId, nftContract, mintedTokenId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-colors duration-200"
                      style={{
                        border: `1px solid ${accent}44`,
                        color: accent,
                      }}
                    >
                      <ExternalLink className="size-4" />
                      View NFT
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* ── Title ──────────────────────────────────────── */}
                <div className="mb-1 text-center">
                  <DialogTitle className="text-2xl font-bold text-white font-display">
                    {nftState.hasMinted ? "Already Claimed" : "You've Earned It!"}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-sm text-white/55 font-body">
                    {nftState.hasMinted
                      ? "You've already claimed your exclusive NFT."
                      : isEligible
                        ? "You reached 100 points — claim your exclusive Quiz On Chain NFT"
                        : "You need 100 total points to unlock this NFT"}
                  </DialogDescription>
                </div>

                {/* ── Stats row ──────────────────────────────────── */}
                <div className="mt-4 flex gap-1.5 md:gap-2">
                  <StatBox
                    value={nftState.loading ? "\u2026" : nftState.points.toString()}
                    label="Your Points"
                    accent={accent}
                  />
                  <StatBox
                    value={nftState.loading ? "\u2026" : nftState.totalMinted.toString()}
                    label="Total Minted"
                  />
                  <StatBox
                    value={chainName}
                    label="Network"
                    accent={accent}
                  />
                </div>

                {/* ── Progress bar ───────────────────────────────── */}
                {!isEligible && !nftState.hasMinted && !nftState.loading && (
                  <div className="mt-4">
                    <div className="mb-1.5 flex justify-between text-xs text-white/50">
                      <span>Progress to NFT</span>
                      <span style={{ color: accent }}>{progress} / 100 pts</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${progress}%`,
                          background: accent,
                        }}
                      />
                    </div>
                    <p className="mt-3 text-center text-xs text-white/40">
                      Keep playing to unlock your NFT badge
                    </p>
                  </div>
                )}

                {/* ── Already minted ─────────────────────────────── */}
                {nftState.hasMinted && (
                  <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-3 text-sm font-medium text-emerald-400">
                    <CheckCircle className="size-4" />
                    <span>NFT already in your wallet</span>
                  </div>
                )}

                {/* ── Chain label ────────────────────────────────── */}
                {isEligible && !nftState.hasMinted && (
                  <p className="mt-3 text-center text-xs text-white/40">
                    Minting on{" "}
                    <span className="font-semibold text-white/70">{chainName}</span>
                  </p>
                )}

                {/* ── Error ──────────────────────────────────────── */}
                {mintState === "failed" && txError && (
                  <div
                    className="mt-3 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs text-red-300 backdrop-blur-sm"
                    style={{
                      borderColor: "rgba(239,68,68,0.2)",
                      background: "rgba(239,68,68,0.1)",
                    }}
                  >
                    <XCircle className="mt-0.5 size-3.5 shrink-0 text-red-400" />
                    <span>{txError}</span>
                  </div>
                )}

                {/* ── Mint button ────────────────────────────────── */}
                {isEligible && !nftState.hasMinted && (
                  <button
                    onClick={handleMint}
                    disabled={mintState === "pending" || !walletClient || !nftContract}
                    className={`relative mt-4 w-full cursor-pointer py-3 text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#FBBF24] focus-visible:outline-none ${getButtonBorderRadius(cfg?.name)} ${getChainFontClass(cfg?.name)}`}
                    style={{
                      background: mintState === "pending" ? `${accent}88` : getButtonGradient(),
                      boxShadow: mintState !== "pending" ? getChainGlow() : "none",
                      color: "#fff",
                      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                    }}
                  >
                    {mintState === "pending" ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        {cfg?.name === "MegaETH" ? "MINTING..." : "Minting\u2026"}
                      </span>
                    ) : !nftContract ? (
                      cfg?.name === "MegaETH" ? "NFT NOT DEPLOYED" : "NFT not deployed on this chain"
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Gem className="size-4" />
                        {cfg?.name === "MegaETH" ? "MINT NFT" : "Mint NFT"}
                      </span>
                    )}
                  </button>
                )}

                {/* No NFT contract */}
                {!nftContract && (
                  <p className="mt-2 text-center text-xs text-white/30">
                    NFT minting is not available on {chainName} yet.
                  </p>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Stat box sub-component ───────────────────────────────────────────────

function StatBox({
  value,
  label,
  accent,
}: {
  value: string
  label: string
  accent?: string
}) {
  return (
    <div className="flex flex-1 flex-col items-center rounded-xl border border-white/[0.07] bg-white/[0.04] py-3">
      <span
        className="text-xl font-bold"
        style={{ color: accent ?? "inherit" }}
      >
        {value}
      </span>
      <span className="text-xs text-white/45">{label}</span>
    </div>
  )
}

// ─── Standalone badge for home screen ─────────────────────────────────────

export function NftBadgeTrigger() {
  const [open, setOpen] = useState(false)
  const { address } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { chainConfig: cfg, isConnected } = useActiveChain()

  const accent = getAccentColor(cfg?.name)
  const nftContract = getNFTContractAddress(chainId)
  const quizContract = getQuizContractAddress(chainId)

  const [eligible, setEligible] = useState(false)
  const [hasMinted, setHasMinted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [points, setPoints] = useState(BigInt(0))

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
          setEligible(pts >= THRESHOLD)
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
      <div
        className={`mb-6 flex flex-col items-center gap-3 border px-4 py-4 text-center transition-all duration-200 sm:flex-row sm:text-left md:px-5 ${getContainerBorderRadius(cfg?.name)}`}
        style={{
          borderColor: `${accent}33`,
          background: `${accent}08`,
        }}
      >
        <div className="flex shrink-0 items-center justify-center rounded-full p-2" style={{ background: `${accent}22` }}>
          <Award className="size-6" style={{ color: accent }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            You&apos;ve reached{" "}
            <span style={{ color: accent }}>{points.toString()} points</span>!
          </p>
          <p className="mt-0.5 text-xs text-foreground/50">
            You&apos;re eligible to claim your exclusive NFT badge
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className={`flex cursor-pointer items-center gap-1.5 px-4 py-2 text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#FBBF24] focus-visible:outline-none ${getBadgeBorderRadius(cfg?.name)} ${getChainFontClass(cfg?.name)}`}
          style={{
            background: getButtonGradient(),
            color: "#fff",
            boxShadow: getChainGlow(),
            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
          }}
        >
          <Gem className="size-4" />
          {cfg?.name === "MegaETH" ? "CLAIM NFT" : "Claim NFT"}
        </button>
      </div>

      {open && <NftMintModal defaultOpen showTrigger={false} onClose={() => setOpen(false)} />}
    </>
  )
}

// ─── NftProgressCard ──────────────────────────────────────────────────────

interface NftProgressCardProps {
  refreshKey?: number
}

export function NftProgressCard({ refreshKey = 0 }: NftProgressCardProps) {
  const [modalOpen, setModalOpen] = useState(false)

  const { address } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { chainConfig: cfg, isConnected } = useActiveChain()

  const accent = getAccentColor(cfg?.name)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, chainId, publicClient, nftContract, quizContract, refreshKey])

  if (!mounted || !isConnected || !nftContract || !quizContract) return null

  const progress = Math.min(100, Number(points))
  const isEligible = points >= THRESHOLD

  const keyframes = `
    @keyframes holderPulse {
      0%, 100% { box-shadow: 0 0 8px ${accent}44; }
      50% { box-shadow: 0 0 18px ${accent}88; }
    }
  `

  return (
    <>
      <style>{keyframes}</style>

      <div
        className={`relative mt-6 w-full max-w-4xl overflow-hidden transition-all ${getContainerBorderRadius(cfg?.name)}`}
        style={{
          border: `1px solid ${accent}22`,
          background: `${accent}04`,
        }}
      >
        <div
          className="absolute bottom-3 left-0 top-3 w-[3px] rounded-r-full"
          style={{ background: accent }}
        />

        <div className="px-5 py-4">
          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-3">
              <div
                className="size-4 animate-spin rounded-full border-2"
                style={{
                  borderColor: "rgba(255,255,255,0.1)",
                  borderTopColor: accent,
                }}
              />
              <span className="text-xs text-foreground/40">Checking NFT progress\u2026</span>
            </div>
          )}

          {/* NFT Holder */}
          {!loading && hasMinted && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <Award className="size-5 shrink-0" style={{ color: accent }} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">NFT Holder</p>
                  <p className="truncate text-xs text-foreground/45">You own Quiz On Chain NFT</p>
                </div>
              </div>
              <span
                className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold"
                style={{
                  color: accent,
                  borderColor: `${accent}55`,
                  background: `${accent}11`,
                  animation: "holderPulse 3s ease-in-out infinite",
                }}
              >
                <Gem className="size-3.5" />
                NFT Holder
              </span>
            </div>
          )}

          {/* Progress bar */}
          {!loading && !hasMinted && !isEligible && (
            <div>
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Trophy className="size-4 shrink-0" style={{ color: accent }} />
                  <span className="truncate text-sm font-medium text-foreground">Progress to NFT</span>
                </div>
                <span className="shrink-0 text-xs font-semibold" style={{ color: accent }}>
                  {progress} / 100 pts
                </span>
              </div>

              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-foreground/10">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progress}%`,
                    minWidth: progress > 0 ? "8px" : "0",
                    background: accent,
                    boxShadow: `0 0 8px ${accent}44`,
                    transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)",
                  }}
                />
              </div>

              <div className="mt-1.5 flex items-center justify-between">
                <p className="text-[11px] text-foreground/35">
                  Each correct answer earns points — keep playing!
                </p>
                <span className="text-[11px] text-foreground/35">{progress}%</span>
              </div>
            </div>
          )}

          {/* Eligible: Claim NFT button */}
          {!loading && !hasMinted && isEligible && (
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-2.5">
                <Award className="size-5 shrink-0" style={{ color: accent }} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    You&apos;ve reached{" "}
                    <span style={{ color: accent }}>{points.toString()} pts</span>!
                  </p>
                  <p className="text-xs text-foreground/45">
                    You&apos;re eligible to claim your exclusive NFT
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className={`flex shrink-0 cursor-pointer items-center gap-1.5 self-start px-4 py-2 text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#FBBF24] focus-visible:outline-none sm:self-auto ${getButtonBorderRadius(cfg?.name)} ${getChainFontClass(cfg?.name)}`}
                style={{
                  background: getButtonGradient(),
                  color: "#fff",
                  boxShadow: getChainGlow(),
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                <Gem className="size-4" />
                {cfg?.name === "MegaETH" ? "CLAIM NFT" : "Claim NFT"}
              </button>
            </div>
          )}
        </div>
      </div>

      {modalOpen && <NftMintModal defaultOpen showTrigger={false} onClose={() => setModalOpen(false)} />}
    </>
  )
}
