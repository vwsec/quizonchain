import { getThemeName } from '@/lib/active-chain-config'

export type ChainThemeKey =
  | 'default'
  | 'megaeth'
  | 'ink'
  | 'unichain'
  | 'base'
  | 'soneium'
  | 'litvm'
  | 'arc'
  | 'abstract'
  | 'sepolia'

export interface ChainUIProfile {
  key: ChainThemeKey
  accent: string
  cta: string
  isLight: boolean
  fontMono: boolean
  fontSerif: boolean
  fontDisplay: boolean
  labelPrefix: string
  labelCase: string
  radius: string
  radiusSm: string
  radiusNav: string
  /** Shared semantic Tailwind class bundles */
  page: string
  pageMain: string
  header: string
  headerFloating: string
  navPill: string
  navActive: string
  navInactive: string
  card: string
  cardStrong: string
  statCard: string
  label: string
  heading: string
  subheading: string
  bodyMuted: string
  btnPrimary: string
  btnSecondary: string
  btnOutline: string
  btnCta: string
  error: string
  warning: string
  input: string
  sheet: string
  tabBar: string
  tabActive: string
  tabInactive: string
  progressTrack: string
  connectBtn: string
}

const PROFILES: Record<ChainThemeKey, ChainUIProfile> = {
  default: {
    key: 'default',
    accent: '#FFFFFF',
    cta: '#FFFFFF',
    isLight: false,
    fontMono: false,
    fontSerif: false,
    fontDisplay: false,
    labelPrefix: '>> ',
    labelCase: 'uppercase tracking-[0.28em] font-mono',
    radius: 'rounded-xl',
    radiusSm: 'rounded-lg',
    radiusNav: 'rounded-xl',
    page: 'text-white',
    pageMain: 'relative z-10 min-h-screen pt-24 pb-12 px-4',
    header: 'bg-black/80 backdrop-blur-xl border border-white/10',
    headerFloating:
      'fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl rounded-xl bg-black/85 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
    navPill:
      'flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10',
    navActive: 'bg-white text-black rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.2)]',
    navInactive:
      'bg-transparent text-white/50 hover:text-white hover:bg-white/[0.05] rounded-lg cursor-pointer',
    card: 'arc-card rounded-xl md:rounded-2xl',
    cardStrong: 'arc-card rounded-2xl arc-glow',
    statCard: 'bg-black border border-white/20 px-4 py-5 text-center',
    label: 'text-xs text-white font-mono uppercase tracking-[0.28em]',
    heading: 'text-4xl md:text-7xl font-bold tracking-tight text-white',
    subheading: 'text-base md:text-lg text-white/60',
    bodyMuted: 'text-white/50',
    btnPrimary:
      'rounded-xl bg-white font-bold text-black hover:bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-colors duration-200 cursor-pointer',
    btnSecondary:
      'rounded-xl border border-white/15 bg-transparent text-white/70 hover:bg-white/10 hover:border-white/40 hover:text-white transition-colors duration-200 cursor-pointer',
    btnOutline:
      'rounded-xl border border-white/15 bg-transparent text-white/70 hover:bg-white/5 hover:border-white/40 hover:text-white transition-colors duration-200 cursor-pointer',
    btnCta:
      'rounded-xl bg-white font-bold text-black hover:bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-colors duration-200 cursor-pointer',
    error:
      'rounded-xl border border-red-500 bg-black text-red-500 px-4 py-3 text-sm',
    warning:
      'rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 px-4 py-3 text-sm',
    input: 'rounded-xl border border-white/10 bg-black text-white',
    sheet: 'bg-black border-white/10',
    tabBar:
      'rounded-xl backdrop-blur-md bg-black/50 border border-white/15 p-1',
    tabActive: 'bg-white text-black rounded-lg',
    tabInactive:
      'text-white/50 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer',
    progressTrack: 'bg-white/10 rounded-full h-2',
    connectBtn:
      'rounded-xl bg-white px-9 py-3.5 text-base font-bold text-black shadow-[0_0_30px_rgba(255,255,255,0.2)] cursor-pointer',
  },
  megaeth: {
    key: 'megaeth',
    accent: '#00ff88',
    cta: '#00ff88',
    isLight: false,
    fontMono: false,
    fontSerif: false,
    fontDisplay: false,
    labelPrefix: '>> ',
    labelCase: 'uppercase tracking-[0.28em] font-mono',
    radius: 'rounded-xl',
    radiusSm: 'rounded-lg',
    radiusNav: 'rounded-xl',
    page: 'text-white',
    pageMain: 'relative z-10 min-h-screen pt-24 pb-12 px-4',
    header: 'bg-black/90 backdrop-blur-xl border-b border-[#00ff88]/10',
    headerFloating:
      'fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl rounded-xl bg-black/90 backdrop-blur-xl border border-[#00ff88]/15',
    navPill:
      'flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10',
    navActive: 'bg-[#00ff88] text-black rounded-lg font-semibold',
    navInactive:
      'bg-transparent text-white/50 hover:text-white hover:bg-white/[0.05] rounded-lg cursor-pointer',
    card: 'arc-card rounded-xl md:rounded-2xl',
    cardStrong: 'arc-card rounded-2xl arc-glow',
    statCard: 'bg-black border border-[#00ff88]/20 px-4 py-5 text-center',
    label: 'text-xs text-[#00ff88] font-mono uppercase tracking-[0.28em]',
    heading: 'text-4xl md:text-7xl font-bold tracking-tight text-white',
    subheading: 'text-base md:text-lg text-[#00ff88]/60',
    bodyMuted: 'text-white/50',
    btnPrimary:
      'rounded-xl bg-[#00ff88] font-bold text-black hover:bg-[#00C9DB] shadow-[0_0_30px_rgba(0,255,136,0.4)] transition-colors duration-200 cursor-pointer',
    btnSecondary:
      'rounded-xl border border-[#00ff88]/30 bg-black text-[#00ff88] hover:bg-[#00ff88]/10 hover:border-[#00ff88]/50 hover:text-[#00ff88] transition-colors duration-200 cursor-pointer',
    btnOutline:
      'rounded-xl border border-white/15 bg-transparent text-white/70 hover:bg-white/5 hover:border-[#00ff88]/40 hover:text-white transition-colors duration-200 cursor-pointer',
    btnCta:
      'rounded-xl bg-[#00ff88] font-bold text-black hover:bg-[#00C9DB] shadow-[0_0_30px_rgba(0,255,136,0.4)] transition-colors duration-200 cursor-pointer',
    error:
      'rounded-xl border border-red-500 bg-black text-red-500 px-4 py-3 text-sm',
    warning:
      'rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 px-4 py-3 text-sm',
    input: 'rounded-xl border border-white/10 bg-black text-white',
    sheet: 'bg-black border-[#00ff88]/15',
    tabBar:
      'rounded-xl backdrop-blur-md bg-black/50 border border-[#00ff88]/15 p-1',
    tabActive: 'bg-[#00ff88] text-black rounded-lg',
    tabInactive:
      'text-white/50 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer',
    progressTrack: 'bg-white/10 rounded-full h-2',
    connectBtn:
      'rounded-xl bg-[#00ff88] px-9 py-3.5 text-base font-bold text-black shadow-[0_0_30px_rgba(0,255,136,0.4)] cursor-pointer',
  },
  ink: {
    key: 'ink',
    accent: '#8b5cf6',
    cta: '#7B61FF',
    isLight: false,
    fontMono: false,
    fontSerif: false,
    fontDisplay: false,
    labelPrefix: '>> ',
    labelCase: 'uppercase tracking-[0.28em] font-mono',
    radius: 'rounded-xl',
    radiusSm: 'rounded-lg',
    radiusNav: 'rounded-xl',
    page: 'text-white',
    pageMain: 'relative z-10 min-h-screen pt-24 pb-12 px-4',
    header: 'bg-black/80 backdrop-blur-xl border-b border-[#8b5cf6]/10',
    headerFloating:
      'fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl rounded-xl bg-black/85 backdrop-blur-xl border border-[#8b5cf6]/15',
    navPill:
      'flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10',
    navActive: 'bg-[#7B61FF] text-white rounded-lg shadow-[0_0_15px_rgba(123,97,255,0.3)] font-semibold',
    navInactive:
      'bg-transparent text-white/50 hover:text-white hover:bg-white/[0.05] rounded-lg cursor-pointer',
    card: 'arc-card rounded-xl md:rounded-2xl',
    cardStrong: 'arc-card rounded-2xl arc-glow',
    statCard: 'bg-black border border-[#8b5cf6]/20 px-4 py-5 text-center',
    label: 'text-xs text-[#8b5cf6] font-mono uppercase tracking-[0.28em]',
    heading: 'text-4xl md:text-7xl font-bold tracking-tight text-white',
    subheading: 'text-base md:text-lg text-[#8b5cf6]/60',
    bodyMuted: 'text-white/50',
    btnPrimary:
      'rounded-xl bg-[#7B61FF] font-bold text-white hover:bg-[#6c54e6] shadow-[0_0_30px_rgba(123,97,255,0.4)] transition-colors duration-200 cursor-pointer',
    btnSecondary:
      'rounded-xl border border-[#8b5cf6]/30 bg-black text-[#8b5cf6] hover:bg-[#8b5cf6]/10 hover:border-[#8b5cf6]/50 hover:text-[#8b5cf6] transition-colors duration-200 cursor-pointer',
    btnOutline:
      'rounded-xl border border-white/15 bg-transparent text-white/70 hover:bg-white/5 hover:border-[#8b5cf6]/40 hover:text-white transition-colors duration-200 cursor-pointer',
    btnCta:
      'rounded-xl bg-[#7B61FF] font-bold text-white hover:bg-[#6c54e6] shadow-[0_0_30px_rgba(123,97,255,0.4)] transition-colors duration-200 cursor-pointer',
    error:
      'rounded-xl border border-red-500 bg-black text-red-500 px-4 py-3 text-sm',
    warning:
      'rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 px-4 py-3 text-sm',
    input: 'rounded-xl border border-white/10 bg-black text-white',
    sheet: 'bg-black border-[#8b5cf6]/15',
    tabBar:
      'rounded-xl backdrop-blur-md bg-black/50 border border-[#8b5cf6]/15 p-1',
    tabActive: 'bg-[#7B61FF] text-white rounded-lg',
    tabInactive:
      'text-white/50 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer',
    progressTrack: 'bg-white/10 rounded-full h-2',
    connectBtn:
      'rounded-xl bg-[#7B61FF] px-9 py-3.5 text-base font-bold text-white shadow-[0_0_30px_rgba(123,97,255,0.4)] cursor-pointer',
  },
  unichain: {
    key: 'unichain',
    accent: '#ff007a',
    cta: '#FF007A',
    isLight: false,
    fontMono: false,
    fontSerif: false,
    fontDisplay: false,
    labelPrefix: '>> ',
    labelCase: 'uppercase tracking-[0.28em] font-mono',
    radius: 'rounded-xl',
    radiusSm: 'rounded-lg',
    radiusNav: 'rounded-xl',
    page: 'text-white',
    pageMain: 'relative z-10 min-h-screen pt-24 pb-12 px-4',
    header: 'bg-black/80 backdrop-blur-xl border-b border-[#FF007A]/10',
    headerFloating:
      'fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl rounded-xl bg-black/85 backdrop-blur-xl border border-[#FF007A]/15',
    navPill:
      'flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10',
    navActive: 'bg-[#FF007A] text-white rounded-lg shadow-[0_0_15px_rgba(255,0,122,0.3)] font-semibold',
    navInactive:
      'bg-transparent text-white/50 hover:text-white hover:bg-white/[0.05] rounded-lg cursor-pointer',
    card: 'arc-card rounded-xl md:rounded-2xl',
    cardStrong: 'arc-card rounded-2xl arc-glow',
    statCard: 'bg-black border border-[#FF007A]/20 px-4 py-5 text-center',
    label: 'text-xs text-[#FF007A] font-mono uppercase tracking-[0.28em]',
    heading: 'text-4xl md:text-7xl font-bold tracking-tight text-white',
    subheading: 'text-base md:text-lg text-[#FF007A]/60',
    bodyMuted: 'text-white/50',
    btnPrimary:
      'rounded-xl bg-[#FF007A] font-bold text-white hover:bg-[#d60066] shadow-[0_0_30px_rgba(255,0,122,0.4)] transition-colors duration-200 cursor-pointer',
    btnSecondary:
      'rounded-xl border border-[#FF007A]/30 bg-black text-[#FF007A] hover:bg-[#FF007A]/10 hover:border-[#FF007A]/50 hover:text-[#FF007A] transition-colors duration-200 cursor-pointer',
    btnOutline:
      'rounded-xl border border-white/15 bg-transparent text-white/70 hover:bg-white/5 hover:border-[#FF007A]/40 hover:text-white transition-colors duration-200 cursor-pointer',
    btnCta:
      'rounded-xl bg-[#FF007A] font-bold text-white hover:bg-[#d60066] shadow-[0_0_30px_rgba(255,0,122,0.4)] transition-colors duration-200 cursor-pointer',
    error:
      'rounded-xl border border-red-500 bg-black text-red-500 px-4 py-3 text-sm',
    warning:
      'rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 px-4 py-3 text-sm',
    input: 'rounded-xl border border-white/10 bg-black text-white',
    sheet: 'bg-black border-[#FF007A]/15',
    tabBar:
      'rounded-xl backdrop-blur-md bg-black/50 border border-[#FF007A]/15 p-1',
    tabActive: 'bg-[#FF007A] text-white rounded-lg',
    tabInactive:
      'text-white/50 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer',
    progressTrack: 'bg-white/10 rounded-full h-2',
    connectBtn:
      'rounded-xl bg-[#FF007A] px-9 py-3.5 text-base font-bold text-white shadow-[0_0_30px_rgba(255,0,122,0.4)] cursor-pointer',
  },
  base: {
    key: 'base',
    accent: '#0000ff',
    cta: '#0000ff',
    isLight: false,
    fontMono: false,
    fontSerif: false,
    fontDisplay: false,
    labelPrefix: '>> ',
    labelCase: 'uppercase tracking-[0.28em] font-mono',
    radius: 'rounded-xl',
    radiusSm: 'rounded-lg',
    radiusNav: 'rounded-xl',
    page: 'text-white',
    pageMain: 'relative z-10 min-h-screen pt-24 pb-12 px-4',
    header: 'bg-black/90 backdrop-blur-xl border-b border-[#0000ff]/10',
    headerFloating:
      'fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl rounded-xl bg-black/90 backdrop-blur-xl border border-[#0000ff]/15',
    navPill:
      'flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10',
    navActive: 'bg-[#0000ff] text-white rounded-lg font-semibold',
    navInactive:
      'bg-transparent text-white/50 hover:text-white hover:bg-white/[0.05] rounded-lg cursor-pointer',
    card: 'arc-card rounded-xl md:rounded-2xl',
    cardStrong: 'arc-card rounded-2xl arc-glow',
    statCard: 'bg-black border border-[#0000ff]/20 px-4 py-5 text-center',
    label: 'text-xs text-[#0000ff] font-mono uppercase tracking-[0.28em]',
    heading: 'text-4xl md:text-7xl font-bold tracking-tight text-white',
    subheading: 'text-base md:text-lg text-[#0000ff]/60',
    bodyMuted: 'text-white/50',
    btnPrimary:
      'rounded-xl bg-[#0000ff] font-bold text-white hover:bg-[#0000cc] shadow-[0_0_30px_rgba(0,0,255,0.4)] transition-colors duration-200 cursor-pointer',
    btnSecondary:
      'rounded-xl border border-[#0000ff]/30 bg-black text-[#0000ff] hover:bg-[#0000ff]/10 hover:border-[#0000ff]/50 hover:text-[#0000ff] transition-colors duration-200 cursor-pointer',
    btnOutline:
      'rounded-xl border border-white/15 bg-transparent text-white/70 hover:bg-white/5 hover:border-[#0000ff]/40 hover:text-white transition-colors duration-200 cursor-pointer',
    btnCta:
      'rounded-xl bg-[#0000ff] font-bold text-white hover:bg-[#0000cc] shadow-[0_0_30px_rgba(0,0,255,0.4)] transition-colors duration-200 cursor-pointer',
    error:
      'rounded-xl border border-red-500 bg-black text-red-500 px-4 py-3 text-sm',
    warning:
      'rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 px-4 py-3 text-sm',
    input: 'rounded-xl border border-white/10 bg-black text-white',
    sheet: 'bg-black border-[#0000ff]/15',
    tabBar:
      'rounded-xl backdrop-blur-md bg-black/50 border border-[#0000ff]/15 p-1',
    tabActive: 'bg-[#0000ff] text-white rounded-lg',
    tabInactive:
      'text-white/50 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer',
    progressTrack: 'bg-white/10 rounded-full h-2',
    connectBtn:
      'rounded-xl bg-[#0000ff] px-9 py-3.5 text-base font-bold text-white shadow-[0_0_30px_rgba(0,0,255,0.4)] cursor-pointer',
  },
  soneium: {
    key: 'soneium',
    accent: '#45DCE8',
    cta: '#45DCE8',
    isLight: false,
    fontMono: false,
    fontSerif: false,
    fontDisplay: false,
    labelPrefix: '>> ',
    labelCase: 'uppercase tracking-[0.28em] font-mono',
    radius: 'rounded-xl',
    radiusSm: 'rounded-lg',
    radiusNav: 'rounded-xl',
    page: 'text-white',
    pageMain: 'relative z-10 min-h-screen pt-24 pb-12 px-4',
    header: 'bg-black/90 backdrop-blur-xl border-b border-[#45DCE8]/10',
    headerFloating:
      'fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl rounded-xl bg-black/90 backdrop-blur-xl border border-[#45DCE8]/15',
    navPill:
      'flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10',
    navActive: 'bg-[#45DCE8]/10 text-[#F8FAFC] rounded-lg font-medium shadow-[inset_0_-2px_0_#45DCE8]',
    navInactive:
      'bg-transparent text-white/50 hover:text-white hover:bg-white/[0.05] rounded-lg cursor-pointer',
    card: 'arc-card rounded-xl md:rounded-2xl',
    cardStrong: 'arc-card rounded-2xl arc-glow',
    statCard: 'bg-black border border-[#45DCE8]/20 px-4 py-5 text-center',
    label: 'text-xs text-[#45DCE8] font-mono uppercase tracking-[0.28em]',
    heading: 'text-4xl md:text-7xl font-bold tracking-tight text-white',
    subheading: 'text-base md:text-lg text-[#45DCE8]/60',
    bodyMuted: 'text-white/50',
    btnPrimary:
      'rounded-xl bg-gradient-to-r from-[#45DCE8] to-[#B45CD0] font-bold text-[#0A0A0A] shadow-[0_0_30px_rgba(69,220,232,0.35)] hover:opacity-90 transition-opacity duration-200 cursor-pointer',
    btnSecondary:
      'rounded-xl border border-[#45DCE8]/30 bg-black text-[#45DCE8] hover:bg-[#45DCE8]/10 hover:border-[#45DCE8]/50 hover:text-[#45DCE8] transition-colors duration-200 cursor-pointer',
    btnOutline:
      'rounded-xl border border-white/15 bg-transparent text-white/70 hover:bg-white/5 hover:border-[#45DCE8]/40 hover:text-white transition-colors duration-200 cursor-pointer',
    btnCta:
      'rounded-xl bg-gradient-to-r from-[#45DCE8] to-[#B45CD0] font-bold text-[#0A0A0A] shadow-[0_0_30px_rgba(69,220,232,0.35)] hover:opacity-90 transition-opacity duration-200 cursor-pointer',
    error:
      'rounded-xl border border-red-500 bg-black text-red-500 px-4 py-3 text-sm',
    warning:
      'rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 px-4 py-3 text-sm',
    input: 'rounded-xl border border-white/10 bg-black text-white',
    sheet: 'bg-black border-[#45DCE8]/15',
    tabBar:
      'rounded-xl backdrop-blur-md bg-black/50 border border-[#45DCE8]/15 p-1',
    tabActive: 'bg-[#45DCE8]/10 text-[#F8FAFC] rounded-lg font-medium shadow-[inset_0_-2px_0_#45DCE8]',
    tabInactive:
      'text-white/50 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer',
    progressTrack: 'bg-white/10 rounded-full h-2',
    connectBtn:
      'rounded-xl bg-gradient-to-r from-[#45DCE8] to-[#B45CD0] px-9 py-3.5 text-base font-bold text-[#0A0A0A] shadow-[0_0_30px_rgba(69,220,232,0.35)] hover:opacity-90 transition-opacity duration-200 cursor-pointer',
  },
  litvm: {
    key: 'litvm',
    accent: '#00F2FE',
    cta: '#00F2FE',
    isLight: false,
    fontMono: false,
    fontSerif: false,
    fontDisplay: false,
    labelPrefix: '>> ',
    labelCase: 'uppercase tracking-[0.28em] font-mono',
    radius: 'rounded-xl',
    radiusSm: 'rounded-lg',
    radiusNav: 'rounded-xl',
    page: 'text-white',
    pageMain: 'relative z-10 min-h-screen pt-24 pb-12 px-4',
    header: 'bg-black/90 backdrop-blur-xl border-b border-[#00F2FE]/10',
    headerFloating:
      'fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl rounded-xl bg-black/90 backdrop-blur-xl border border-[#00F2FE]/15',
    navPill:
      'flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10',
    navActive: 'bg-[#00F2FE] text-black rounded-lg shadow-[0_0_20px_rgba(0,242,254,0.3)] font-bold',
    navInactive:
      'bg-transparent text-white/50 hover:text-[#00F2FE] hover:bg-[#00F2FE]/5 rounded-lg font-semibold cursor-pointer',
    card: 'arc-card rounded-xl md:rounded-2xl',
    cardStrong: 'arc-card rounded-2xl arc-glow',
    statCard: 'bg-black border border-[#00F2FE]/20 px-4 py-5 text-center',
    label: 'text-xs text-[#00F2FE] font-mono uppercase tracking-[0.28em]',
    heading: 'text-4xl md:text-7xl font-bold tracking-tight text-white',
    subheading: 'text-base md:text-lg text-[#00F2FE]/60',
    bodyMuted: 'text-white/50',
    btnPrimary:
      'rounded-xl bg-[#00F2FE] font-bold text-black hover:bg-[#00C9DB] shadow-[0_0_30px_rgba(0,242,254,0.4)] transition-colors duration-200 cursor-pointer',
    btnSecondary:
      'rounded-xl border border-[#00F2FE]/30 bg-black text-[#00F2FE] hover:bg-[#00F2FE]/10 hover:border-[#00F2FE]/50 hover:text-[#00F2FE] transition-colors duration-200 cursor-pointer',
    btnOutline:
      'rounded-xl border border-white/15 bg-transparent text-white/70 hover:bg-white/5 hover:border-[#00F2FE]/40 hover:text-white transition-colors duration-200 cursor-pointer',
    btnCta:
      'rounded-xl bg-[#00F2FE] font-bold text-black hover:bg-[#00C9DB] shadow-[0_0_30px_rgba(0,242,254,0.4)] transition-colors duration-200 cursor-pointer',
    error:
      'rounded-xl border border-red-500 bg-black text-red-500 px-4 py-3 text-sm',
    warning:
      'rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 px-4 py-3 text-sm',
    input: 'rounded-xl border border-white/10 bg-black text-white',
    sheet: 'bg-black border-[#00F2FE]/15',
    tabBar:
      'rounded-xl backdrop-blur-md bg-black/50 border border-[#00F2FE]/15 p-1',
    tabActive: 'bg-[#00F2FE] text-black rounded-lg font-bold',
    tabInactive:
      'text-white/50 hover:text-[#00F2FE] hover:bg-[#00F2FE]/5 rounded-lg cursor-pointer',
    progressTrack: 'bg-white/10 rounded-full h-2',
    connectBtn:
      'rounded-xl bg-[#00F2FE] px-9 py-3.5 text-base font-bold text-black shadow-[0_0_30px_rgba(0,242,254,0.4)] cursor-pointer',
  },
  arc: {
    key: 'arc',
    accent: '#4D8EE9',
    cta: '#4D8EE9',
    isLight: false,
    fontMono: false,
    fontSerif: false,
    fontDisplay: false,
    labelPrefix: '>> ',
    labelCase: 'uppercase tracking-[0.28em] font-mono',
    radius: 'rounded-xl',
    radiusSm: 'rounded-lg',
    radiusNav: 'rounded-xl',
    page: 'text-white',
    pageMain: 'relative z-10 min-h-screen pt-24 pb-12 px-4',
    header: 'bg-black/90 backdrop-blur-xl border-b border-[#4D8EE9]/10',
    headerFloating:
      'fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl rounded-xl bg-black/90 backdrop-blur-xl border border-[#4D8EE9]/15',
    navPill:
      'flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10',
    navActive: 'bg-[#4D8EE9] text-white rounded-lg font-semibold',
    navInactive:
      'bg-transparent text-white/50 hover:text-white hover:bg-white/[0.05] rounded-lg cursor-pointer',
    card: 'arc-card rounded-xl md:rounded-2xl',
    cardStrong: 'arc-card rounded-2xl arc-glow',
    statCard: 'bg-black border border-[#4D8EE9]/20 px-4 py-5 text-center',
    label: 'text-xs text-[#4D8EE9] font-mono uppercase tracking-[0.28em]',
    heading: 'text-4xl md:text-7xl font-bold tracking-tight text-white',
    subheading: 'text-base md:text-lg text-[#4D8EE9]/60',
    bodyMuted: 'text-white/50',
    btnPrimary:
      'rounded-xl bg-[#4D8EE9] font-bold text-white hover:bg-[#3A7BD6] shadow-[0_0_30px_rgba(77,142,233,0.4)] transition-colors duration-200 cursor-pointer',
    btnSecondary:
      'rounded-xl border border-[#4D8EE9]/30 bg-black text-[#4D8EE9] hover:bg-[#4D8EE9]/10 hover:border-[#4D8EE9]/50 hover:text-[#4D8EE9] transition-colors duration-200 cursor-pointer',
    btnOutline:
      'rounded-xl border border-white/15 bg-transparent text-white/70 hover:bg-white/5 hover:border-[#4D8EE9]/40 hover:text-white transition-colors duration-200 cursor-pointer',
    btnCta:
      'rounded-xl bg-[#4D8EE9] font-bold text-white hover:bg-[#3A7BD6] shadow-[0_0_30px_rgba(77,142,233,0.4)] transition-colors duration-200 cursor-pointer',
    error:
      'rounded-xl border border-red-500 bg-black text-red-500 px-4 py-3 text-sm',
    warning:
      'rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 px-4 py-3 text-sm',
    input: 'rounded-xl border border-white/10 bg-black text-white',
    sheet: 'bg-black border-[#4D8EE9]/15',
    tabBar:
      'rounded-xl backdrop-blur-md bg-black/50 border border-[#4D8EE9]/15 p-1',
    tabActive: 'bg-[#4D8EE9] text-white rounded-lg',
    tabInactive:
      'text-white/50 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer',
    progressTrack: 'bg-white/10 rounded-full h-2',
    connectBtn:
      'rounded-xl bg-[#4D8EE9] px-9 py-3.5 text-base font-bold text-white shadow-[0_0_30px_rgba(77,142,233,0.4)] cursor-pointer',
  },
  abstract: {
    key: 'abstract',
    accent: '#00b30f',
    cta: '#00b30f',
    isLight: false,
    fontMono: false,
    fontSerif: false,
    fontDisplay: false,
    labelPrefix: '>> ',
    labelCase: 'uppercase tracking-[0.28em] font-mono',
    radius: 'rounded-xl',
    radiusSm: 'rounded-lg',
    radiusNav: 'rounded-xl',
    page: 'text-white',
    pageMain: 'relative z-10 min-h-screen pt-24 pb-12 px-4',
    header: 'bg-black/90 backdrop-blur-xl border-b border-[#00b30f]/10',
    headerFloating:
      'fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl rounded-xl bg-black/90 backdrop-blur-xl border border-[#00b30f]/15',
    navPill:
      'flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10',
    navActive: 'bg-[#00b30f] text-white rounded-lg shadow-[0_0_15px_rgba(0,179,15,0.3)] font-semibold',
    navInactive:
      'bg-transparent text-white/50 hover:text-white hover:bg-white/[0.05] rounded-lg cursor-pointer',
    card: 'arc-card rounded-xl md:rounded-2xl',
    cardStrong: 'arc-card rounded-2xl arc-glow',
    statCard: 'bg-black border border-[#00b30f]/20 px-4 py-5 text-center',
    label: 'text-xs text-[#00b30f] font-mono uppercase tracking-[0.28em]',
    heading: 'text-4xl md:text-7xl font-bold tracking-tight text-white',
    subheading: 'text-base md:text-lg text-[#00b30f]/60',
    bodyMuted: 'text-white/50',
    btnPrimary:
      'rounded-xl bg-[#00b30f] font-bold text-white shadow-[0_0_30px_rgba(0,179,15,0.4)] hover:bg-[#009a36] transition-colors duration-200 cursor-pointer',
    btnSecondary:
      'rounded-xl border border-[#00b30f]/30 bg-black text-[#00b30f] hover:bg-[#00b30f]/10 hover:border-[#00b30f]/50 hover:text-[#00b30f] transition-colors duration-200 cursor-pointer',
    btnOutline:
      'rounded-xl border border-white/15 bg-transparent text-white/70 hover:bg-white/5 hover:border-[#00b30f]/40 hover:text-white transition-colors duration-200 cursor-pointer',
    btnCta:
      'rounded-xl bg-[#00b30f] font-bold text-white hover:bg-[#009a36] shadow-[0_0_30px_rgba(0,179,15,0.4)] transition-colors duration-200 cursor-pointer',
    error:
      'rounded-xl border border-red-500 bg-black text-red-500 px-4 py-3 text-sm',
    warning:
      'rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 px-4 py-3 text-sm',
    input: 'rounded-xl border border-white/10 bg-black text-white',
    sheet: 'bg-black border-[#00b30f]/15',
    tabBar:
      'rounded-xl backdrop-blur-md bg-black/50 border border-[#00b30f]/15 p-1',
    tabActive: 'bg-[#00b30f] text-white rounded-lg',
    tabInactive:
      'text-white/50 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer',
    progressTrack: 'bg-white/10 rounded-full h-2',
    connectBtn:
      'rounded-xl bg-[#00b30f] px-9 py-3.5 text-base font-bold text-white shadow-[0_0_30px_rgba(0,179,15,0.4)] cursor-pointer',
  },
  sepolia: {
    key: 'sepolia',
    accent: '#cbaeff',
    cta: '#cbaeff',
    isLight: false,
    fontMono: false,
    fontSerif: false,
    fontDisplay: false,
    labelPrefix: '>> ',
    labelCase: 'uppercase tracking-[0.28em] font-mono',
    radius: 'rounded-xl',
    radiusSm: 'rounded-lg',
    radiusNav: 'rounded-xl',
    page: 'text-white',
    pageMain: 'relative z-10 min-h-screen pt-24 pb-12 px-4',
    header: 'bg-black/90 backdrop-blur-xl border-b border-[#cbaeff]/10',
    headerFloating:
      'fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl rounded-xl bg-black/90 backdrop-blur-xl border border-[#cbaeff]/15',
    navPill:
      'flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10',
    navActive: 'bg-[#cbaeff] text-black rounded-lg font-semibold',
    navInactive:
      'bg-transparent text-white/50 hover:text-white hover:bg-white/[0.05] rounded-lg cursor-pointer',
    card: 'arc-card rounded-xl md:rounded-2xl',
    cardStrong: 'arc-card rounded-2xl arc-glow',
    statCard: 'bg-black border border-[#cbaeff]/20 px-4 py-5 text-center',
    label: 'text-xs text-[#cbaeff] font-mono uppercase tracking-[0.28em]',
    heading: 'text-4xl md:text-7xl font-bold tracking-tight text-white',
    subheading: 'text-base md:text-lg text-[#cbaeff]/60',
    bodyMuted: 'text-white/50',
    btnPrimary:
      'rounded-xl bg-[#cbaeff] font-bold text-black hover:bg-[#ac94d9] shadow-[0_0_30px_rgba(203,174,255,0.4)] transition-colors duration-200 cursor-pointer',
    btnSecondary:
      'rounded-xl border border-[#cbaeff]/30 bg-black text-[#cbaeff] hover:bg-[#cbaeff]/10 hover:border-[#cbaeff]/50 hover:text-[#cbaeff] transition-colors duration-200 cursor-pointer',
    btnOutline:
      'rounded-xl border border-white/15 bg-transparent text-white/70 hover:bg-white/5 hover:border-[#cbaeff]/40 hover:text-white transition-colors duration-200 cursor-pointer',
    btnCta:
      'rounded-xl bg-[#cbaeff] font-bold text-black hover:bg-[#ac94d9] shadow-[0_0_30px_rgba(203,174,255,0.4)] transition-colors duration-200 cursor-pointer',
    error:
      'rounded-xl border border-red-500 bg-black text-red-500 px-4 py-3 text-sm',
    warning:
      'rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 px-4 py-3 text-sm',
    input: 'rounded-xl border border-white/10 bg-black text-white',
    sheet: 'bg-black border-[#cbaeff]/15',
    tabBar:
      'rounded-xl backdrop-blur-md bg-black/50 border border-[#cbaeff]/15 p-1',
    tabActive: 'bg-[#cbaeff] text-black rounded-lg',
    tabInactive:
      'text-white/50 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer',
    progressTrack: 'bg-white/10 rounded-full h-2',
    connectBtn:
      'rounded-xl bg-[#cbaeff] px-9 py-3.5 text-base font-bold text-black shadow-[0_0_30px_rgba(203,174,255,0.4)] cursor-pointer',
  },
}

export function getChainThemeKey(
  chainName: string | undefined,
  isConnected: boolean,
): ChainThemeKey {
  if (!isConnected || !chainName) return 'default'
  const theme = getThemeName({ name: chainName })
  if (theme && theme in PROFILES) return theme as ChainThemeKey
  return 'default'
}

export function getChainUI(
  chainName: string | undefined,
  isConnected: boolean,
): ChainUIProfile {
  const key = getChainThemeKey(chainName, isConnected)
  return PROFILES[key]
}

export function accentTextClass(ui: ChainUIProfile): string {
  if (ui.key === 'megaeth') return 'text-[#00ff88]'
  if (ui.key === 'ink') return 'text-[#8b5cf6]'
  if (ui.key === 'unichain') return 'text-[#ff007a]'
  if (ui.key === 'litvm') return 'text-[#00F2FE]'
  if (ui.key === 'arc') return 'text-[#4D8EE9]'
  if (ui.key === 'soneium') return 'text-[#45DCE8]'
  if (ui.key === 'base') return 'text-[#0000ff]'
  if (ui.key === 'abstract') return 'text-[#00b30f]'
  if (ui.key === 'sepolia') return 'text-[#cbaeff]'
  return 'text-white'
}
