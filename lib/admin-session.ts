import { SignJWT, jwtVerify } from "jose"

// Lazy getter: env checks run at request time, not module scope,
// so `next build` (which imports every route) works without secrets.
function getSessionSecret(): Uint8Array {
  const secret = process.env.QUIZ_JWT_SECRET
  if (!secret) {
    throw new Error("QUIZ_JWT_SECRET is not set. Configure it in your environment variables.")
  }
  return new TextEncoder().encode(secret)
}
const COOKIE_NAME = "admin_session"
const COOKIE_MAX_AGE = 60 * 60 * 24 // 24 hours

export async function createSession(): Promise<string> {
  return await new SignJWT({ role: "admin", t: "admin-session" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE}s`)
    .sign(getSessionSecret())
}

export function makeSessionCookie(token: string): string {
  return [
    `${COOKIE_NAME}=${token}`,
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    `Max-Age=${COOKIE_MAX_AGE}`,
    "Path=/",
  ].join("; ")
}

export async function getSession(request: Request): Promise<boolean> {
  const cookie = request.headers.get("cookie") || ""
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`))
  if (!match) return false
  try {
    const { payload } = await jwtVerify(match[1], getSessionSecret())
    return payload.role === "admin" && payload.t === "admin-session"
  } catch {
    return false
  }
}
