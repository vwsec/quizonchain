// static prerender bakes inline RSC scripts without the CSP nonce; force-dynamic lets middleware attach it
export const dynamic = 'force-dynamic'

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
