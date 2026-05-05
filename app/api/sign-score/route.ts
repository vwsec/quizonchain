export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"
import { z } from "zod"
import {
  encodeAbiParameters,
  isAddress,
  keccak256,
  toBytes,
} from "viem"
import { privateKeyToAccount } from "viem/accounts"

const bodySchema = z.object({
  playerAddress: z.string(),
  score: z.number().int().min(0).max(255),
  total: z.number().int().min(1).max(20),
  nonce: z.number().int(),
  chainId: z.number().int(),
  contractAddress: z.string()
})

function getSignerPrivateKey(): `0x${string}` {
  const raw = (process.env.QUIZ_SIGNER_PRIVATE_KEY || process.env.SIGNER_PRIVATE_KEY)?.trim()
  if (!raw) {
    throw new Error("QUIZ_SIGNER_PRIVATE_KEY or SIGNER_PRIVATE_KEY is missing on the server.")
  }
  const prefixed = raw.startsWith("0x") ? raw : `0x${raw}`
  if (!/^0x[0-9a-fA-F]{64}$/.test(prefixed)) {
    throw new Error("QUIZ_SIGNER_PRIVATE_KEY must be a 32-byte hex private key.")
  }
  return prefixed as `0x${string}`
}

export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: "Malformed JSON body" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    console.error("Invalid request body:", parsed.error.format())
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { playerAddress, score, total, nonce, chainId, contractAddress } = parsed.data
  if (!isAddress(playerAddress)) {
    return NextResponse.json({ error: "Invalid player address" }, { status: 400 })
  }
  if (!isAddress(contractAddress)) {
    return NextResponse.json({ error: "Invalid contract address" }, { status: 400 })
  }
  if (score > total) {
    return NextResponse.json({ error: "Score cannot exceed total" }, { status: 400 })
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("--- Server /api/sign-score received: ---")
    console.debug({ playerAddress, score, total, nonce, chainId, contractAddress })
  }

  try {
    const account = privateKeyToAccount(getSignerPrivateKey())

    // Must use encodeAbiParameters to match abi.encode (padded, not packed)
    const encoded = encodeAbiParameters(
      [
        { type: "address" },
        { type: "uint8" },
        { type: "uint8" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "address" },
      ],
      [
        playerAddress as `0x${string}`, 
        score, 
        total, 
        BigInt(nonce), 
        BigInt(chainId), 
        contractAddress as `0x${string}`
      ]
    )

    const digest = keccak256(encoded)

    if (process.env.NODE_ENV === "development") {
      console.log("Encoded digest:", digest)
    }

    // toEthSignedMessageHash adds the Ethereum prefix '\x19Ethereum Signed Message:\n32'
    const signature = await account.signMessage({
      message: { raw: toBytes(digest) }
    })

    return NextResponse.json({
      signature,
      trustedSigner: account.address,
    })
  } catch (err) {
    console.error("Signature generation error:", err)
    const message = err instanceof Error ? err.message : "Failed to sign score."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

