// static 404 prerender bakes inline RSC scripts without the CSP nonce; force-dynamic lets middleware attach it
export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">404</h1>
        <p className="mt-2 text-sm text-white/60">This page doesn&apos;t exist.</p>
      </div>
    </main>
  )
}
