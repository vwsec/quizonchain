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
    fontDisplay: true,
    labelPrefix: '',
    labelCase: 'uppercase tracking-[0.28em]',
    radius: 'rounded-xl',
    radiusSm: 'rounded-lg',
    radiusNav: 'rounded-xl',
    page: 'text-[#E2E8F0] font-body',
    pageMain: 'relative z-10 min-h-screen pt-24 pb-12 px-4',
    header: 'bg-black/80 backdrop-blur-xl border border-white/10',
    headerFloating:
      'fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl rounded-2xl bg-black/85 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
    navPill:
      'flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10',
    navActive: 'bg-white text-black rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.2)]',
    navInactive:
      'bg-transparent text-white/50 hover:text-white hover:bg-white/[0.06] rounded-lg cursor-pointer',
    card: 'glass-card rounded-xl',
    cardStrong: 'glass-card-strong rounded-xl',
    statCard:
      'rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md px-4 py-5 text-center',
    label: 'text-micro text-white/70',
    heading: 'font-display text-display font-bold text-white glow-text',
    subheading: 'text-body text-[#E2E8F0]/70 max-w-xl',
    bodyMuted: 'text-[#94A3B8]',
    btnPrimary:
      'rounded-xl bg-white font-semibold text-black shadow-[0_0_24px_rgba(255,255,255,0.2)] hover:bg-white/90 transition-colors duration-200 cursor-pointer',
    btnSecondary:
      'rounded-xl border border-white/15 bg-white/[0.04] font-medium text-white hover:bg-white/[0.08] transition-colors duration-200 cursor-pointer',
    btnOutline:
      'rounded-xl border border-white/15 bg-transparent font-medium text-white/70 hover:text-white hover:border-white/25 transition-colors duration-200 cursor-pointer',
    btnCta:
      'rounded-xl bg-white font-semibold text-black shadow-[0_0_24px_rgba(255,255,255,0.2)] hover:bg-white/90 transition-colors duration-200 cursor-pointer',
    error:
      'rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3 text-sm',
    warning:
      'rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 px-4 py-3 text-sm',
    input: 'rounded-xl border border-white/15 bg-white/[0.04] text-white',
    sheet: 'bg-black border-white/10',
    tabBar:
      'rounded-2xl backdrop-blur-md bg-black/50 border border-white/10 p-1',
    tabActive: 'bg-white text-black rounded-xl',
    tabInactive:
      'text-white/50 hover:text-white hover:bg-white/5 rounded-xl cursor-pointer',
    progressTrack: 'bg-white/10 rounded-full h-2',
    connectBtn:
      'rounded-full bg-white px-9 py-3.5 text-base font-bold text-black shadow-[0_0_24px_rgba(255,255,255,0.2)] hover:bg-white/90 transition-colors duration-200 cursor-pointer',
  },
  megaeth: {
    key: 'megaeth',
    accent: '#00ff88',
    cta: '#00ff88',
    isLight: false,
    fontMono: true,
    fontSerif: false,
    fontDisplay: false,
    labelPrefix: '// ',
    labelCase: 'uppercase tracking-[0.28em] font-mono',
    radius: 'rounded-none',
    radiusSm: 'rounded-none',
    radiusNav: 'rounded-none',
    page: 'text-white font-mono',
    pageMain: 'relative z-10 min-h-screen pt-24 pb-12 px-4',
    header: 'bg-black border-b border-white/10',
    headerFloating:
      'fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl rounded-none bg-black/95 backdrop-blur-xl border border-white/10',
    navPill: 'flex items-center p-1 rounded-none bg-black border border-white/10',
    navActive: 'bg-white text-black rounded-none font-mono uppercase',
    navInactive:
      'bg-transparent text-white/50 hover:text-white hover:bg-white/[0.05] rounded-none font-mono uppercase cursor-pointer',
    card: 'bg-black border border-white/15 rounded-none',
    cardStrong: 'bg-black border border-white/20 rounded-none',
    statCard: 'bg-black border border-white/10 rounded-none px-4 py-5 text-center',
    label: 'text-xs text-[#00ff88] font-mono uppercase tracking-[0.28em]',
    heading: 'text-4xl md:text-7xl font-bold uppercase font-mono tracking-tight text-white',
    subheading: 'text-white/40 font-mono lowercase text-sm',
    bodyMuted: 'text-white/40 font-mono',
    btnPrimary:
      'rounded-none border border-[#00ff88] bg-black text-[#00ff88] hover:bg-[#00ff88] hover:text-black font-mono uppercase transition-colors duration-200 cursor-pointer',
    btnSecondary:
      'rounded-none border border-white/20 bg-black text-white hover:border-white/40 font-mono uppercase transition-colors duration-200 cursor-pointer',
    btnOutline:
      'rounded-none border border-white/15 bg-black text-white/50 hover:text-white font-mono uppercase transition-colors duration-200 cursor-pointer',
    btnCta:
      'rounded-none border border-[#00ff88] bg-[#00ff88] text-black hover:bg-[#00ff88]/90 font-mono uppercase font-bold transition-colors duration-200 cursor-pointer',
    error: 'rounded-none border border-red-500 bg-black text-red-500 px-4 py-3 text-sm font-mono',
    warning: 'rounded-none border border-amber-500 bg-black text-amber-500 px-4 py-3 text-sm font-mono uppercase',
    input: 'rounded-none border border-white/15 bg-black text-white font-mono',
    sheet: 'bg-black border-white/10',
    tabBar: 'rounded-none bg-black border border-white/15 p-1',
    tabActive: 'bg-white text-black rounded-none font-mono uppercase',
    tabInactive:
      'text-white/50 hover:text-white hover:bg-white/5 rounded-none font-mono uppercase cursor-pointer',
    progressTrack: 'bg-white/10 rounded-none h-2',
    connectBtn:
      'rounded-none border border-[#00ff88] bg-[#00ff88] px-9 py-3.5 text-base font-bold text-black font-mono uppercase cursor-pointer',
  },
  ink: {
    key: 'ink',
    accent: '#8b5cf6',
    cta: '#7B61FF',
    isLight: false,
    fontMono: false,
    fontSerif: false,
    fontDisplay: false,
    labelPrefix: '',
    labelCase: 'uppercase tracking-[0.28em]',
    radius: 'rounded-3xl',
    radiusSm: 'rounded-full',
    radiusNav: 'rounded-full',
    page: 'text-white',
    pageMain: 'relative z-10 min-h-screen pt-24 pb-12 px-4',
    header: 'bg-[#0a0a0f]/80 backdrop-blur-md border-b border-[#8b5cf6]/10',
    headerFloating:
      'fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl rounded-3xl bg-[#0a0a0f]/85 backdrop-blur-xl border border-[#8b5cf6]/15',
    navPill:
      'flex items-center p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-lg',
    navActive:
      'bg-[#7B61FF] text-white rounded-full shadow-[0_0_15px_rgba(123,97,255,0.3)] font-semibold',
    navInactive:
      'bg-transparent text-white/50 hover:text-white hover:bg-white/[0.05] rounded-full font-semibold cursor-pointer',
    card: 'rounded-2xl md:rounded-3xl border border-white/10 bg-white/5 backdrop-blur-lg',
    cardStrong:
      'rounded-3xl border border-white/15 bg-white/[0.08] backdrop-blur-xl shadow-[0_0_30px_rgba(139,92,246,0.08)]',
    statCard:
      'rounded-3xl border border-white/5 bg-white/5 backdrop-blur-lg px-4 py-5 text-center',
    label: 'text-xs text-[#8b5cf6] uppercase tracking-[0.28em] font-semibold',
    heading: 'text-4xl md:text-7xl font-bold tracking-tighter text-white',
    subheading: 'text-base md:text-lg text-white/70 font-medium',
    bodyMuted: 'text-white/60',
    btnPrimary:
      'rounded-full bg-[#7B61FF] font-bold text-white hover:bg-[#6c54e6] shadow-[0_0_30px_rgba(123,97,255,0.4)] transition-colors duration-200 cursor-pointer',
    btnSecondary:
      'rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 backdrop-blur-lg transition-colors duration-200 cursor-pointer',
    btnOutline:
      'rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors duration-200 cursor-pointer',
    btnCta:
      'rounded-full bg-[#7B61FF] font-bold text-white hover:bg-[#6c54e6] shadow-[0_0_30px_rgba(123,97,255,0.4)] transition-colors duration-200 cursor-pointer',
    error:
      'rounded-full border border-red-500/30 bg-red-500/10 text-red-300 backdrop-blur-md px-6 py-3 text-sm',
    warning:
      'rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300 px-4 py-3 text-sm',
    input: 'rounded-full border border-white/10 bg-white/5 text-white',
    sheet: 'bg-[#0a0a0f] border-[#8b5cf6]/10',
    tabBar:
      'rounded-2xl backdrop-blur-md bg-black/50 border border-white/10 p-1',
    tabActive: 'bg-[#7B61FF] text-white rounded-full',
    tabInactive:
      'text-white/50 hover:text-white hover:bg-white/5 rounded-full cursor-pointer',
    progressTrack: 'bg-white/5 rounded-full h-2',
    connectBtn:
      'rounded-full bg-[#7B61FF] px-9 py-3.5 text-base font-bold text-white shadow-[0_0_30px_rgba(123,97,255,0.4)] cursor-pointer',
  },
  unichain: {
    key: 'unichain',
    accent: '#ff007a',
    cta: '#FF007A',
    isLight: false,
    fontMono: false,
    fontSerif: true,
    fontDisplay: false,
    labelPrefix: '// ',
    labelCase: 'uppercase tracking-[0.28em] font-mono',
    radius: 'rounded-2xl',
    radiusSm: 'rounded-2xl',
    radiusNav: 'rounded-full',
    page: 'text-white',
    pageMain: 'relative z-10 min-h-screen pt-24 pb-12 px-4',
    header: 'bg-[#0a0a0f]/80 backdrop-blur-md border-b border-[#FF007A]/10',
    headerFloating:
      'fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl rounded-2xl bg-[#0d0014]/85 backdrop-blur-xl border border-[#FF007A]/15',
    navPill:
      'flex items-center p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-lg',
    navActive:
      'bg-[#FF007A] text-white rounded-xl shadow-[0_0_15px_rgba(255,0,122,0.3)] font-semibold',
    navInactive:
      'bg-transparent text-white/50 hover:text-white hover:bg-white/[0.05] rounded-xl font-semibold cursor-pointer',
    card: 'rounded-xl md:rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg',
    cardStrong:
      'rounded-2xl border border-[#FF007A]/20 bg-white/[0.06] backdrop-blur-xl',
    statCard:
      'rounded-2xl border border-white/5 bg-white/5 backdrop-blur-lg px-4 py-5 text-center',
    label: 'text-xs text-[#FF007A] font-mono uppercase tracking-[0.28em]',
    heading: 'text-4xl md:text-7xl font-bold tracking-tight font-serif text-white',
    subheading: 'text-base text-[#FF007A]/80 font-medium',
    bodyMuted: 'text-white/60',
    btnPrimary:
      'rounded-2xl bg-[#FF007A] font-bold text-white hover:bg-[#d60066] shadow-[0_0_30px_rgba(255,0,122,0.4)] transition-colors duration-200 cursor-pointer',
    btnSecondary:
      'rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10 backdrop-blur-lg transition-colors duration-200 cursor-pointer',
    btnOutline:
      'rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors duration-200 cursor-pointer',
    btnCta:
      'rounded-2xl bg-[#FF007A] font-bold text-white hover:bg-[#d60066] shadow-[0_0_30px_rgba(255,0,122,0.4)] transition-colors duration-200 cursor-pointer',
    error:
      'rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300 px-4 py-3 text-sm',
    warning:
      'rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300 px-4 py-3 text-sm',
    input: 'rounded-2xl border border-white/10 bg-white/5 text-white',
    sheet: 'bg-[#0d0014] border-[#FF007A]/10',
    tabBar:
      'rounded-2xl backdrop-blur-md bg-black/50 border border-white/10 p-1',
    tabActive: 'bg-[#FF007A] text-white rounded-xl',
    tabInactive:
      'text-white/50 hover:text-white hover:bg-white/5 rounded-xl cursor-pointer',
    progressTrack: 'bg-white/5 rounded-full h-2',
    connectBtn:
      'rounded-2xl bg-[#FF007A] px-9 py-3.5 text-base font-bold text-white shadow-[0_0_30px_rgba(255,0,122,0.4)] cursor-pointer',
  },
  base: {
    key: 'base',
    accent: '#0052ff',
    cta: '#0052FF',
    isLight: true,
    fontMono: false,
    fontSerif: false,
    fontDisplay: false,
    labelPrefix: '',
    labelCase: 'uppercase tracking-[0.2em] font-semibold',
    radius: 'rounded-xl',
    radiusSm: 'rounded-lg',
    radiusNav: 'rounded-full',
    page: 'text-black',
    pageMain: 'relative z-10 min-h-screen pt-24 pb-12 px-4',
    header: 'bg-white/90 backdrop-blur-md border-b border-black/5',
    headerFloating:
      'fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl rounded-2xl bg-white/90 backdrop-blur-xl border border-black/8 shadow-lg',
    navPill:
      'flex items-center p-1 rounded-full bg-black/5 border border-black/5',
    navActive: 'bg-[#0052FF] text-white rounded-full font-semibold',
    navInactive:
      'bg-transparent text-black/50 hover:text-black hover:bg-black/5 rounded-full cursor-pointer',
    card: 'rounded-xl md:rounded-2xl border border-black/5 bg-[#f4f5f7]',
    cardStrong: 'rounded-2xl border border-black/8 bg-white shadow-sm',
    statCard:
      'rounded-2xl border border-black/5 bg-[#f4f5f7] shadow-sm px-4 py-5 text-center',
    label: 'text-xs text-[#0052FF] uppercase tracking-[0.2em] font-semibold',
    heading: 'text-4xl md:text-7xl font-bold tracking-tighter text-black',
    subheading: 'text-base text-black/60 font-medium',
    bodyMuted: 'text-black/40',
    btnPrimary:
      'rounded-full bg-[#0052FF] font-bold text-white hover:bg-[#0047FF] shadow-lg transition-colors duration-200 cursor-pointer',
    btnSecondary:
      'rounded-full border-2 border-black/5 bg-black/5 text-black hover:bg-black/10 transition-colors duration-200 cursor-pointer',
    btnOutline:
      'rounded-full border border-black/10 bg-transparent text-black/60 hover:text-black transition-colors duration-200 cursor-pointer',
    btnCta:
      'rounded-full bg-[#0052FF] font-bold text-white hover:bg-[#0047FF] shadow-lg transition-colors duration-200 cursor-pointer',
    error:
      'rounded-xl border border-red-200 bg-red-50 text-red-600 px-4 py-3 text-sm',
    warning:
      'rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-700 px-4 py-3 text-sm',
    input: 'rounded-xl border border-black/10 bg-white text-black',
    sheet: 'bg-white border-black/5',
    tabBar: 'rounded-2xl bg-white/50 border border-black/10 p-1',
    tabActive: 'bg-[#0052FF] text-white rounded-full',
    tabInactive:
      'text-black/50 hover:text-black hover:bg-black/5 rounded-full cursor-pointer',
    progressTrack: 'bg-black/5 rounded-full h-2',
    connectBtn:
      'rounded-full bg-[#0052FF] px-9 py-3.5 text-base font-bold text-white shadow-lg cursor-pointer',
  },
  soneium: {
    key: 'soneium',
    accent: '#0047FF',
    cta: '#0047FF',
    isLight: false,
    fontMono: false,
    fontSerif: false,
    fontDisplay: false,
    labelPrefix: '',
    labelCase: 'uppercase tracking-[0.28em] font-semibold',
    radius: 'rounded-xl',
    radiusSm: 'rounded-lg',
    radiusNav: 'rounded-full',
    page: 'text-white',
    pageMain: 'relative z-10 min-h-screen pt-24 pb-12 px-4',
    header: 'bg-[#00040F]/80 backdrop-blur-xl border-b border-[#0047FF]/10',
    headerFloating:
      'fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl rounded-2xl bg-[#00040F]/85 backdrop-blur-xl border border-[#0047FF]/15',
    navPill:
      'flex items-center p-1 rounded-full bg-white/[0.03] border border-[#0047FF]/20 backdrop-blur-xl',
    navActive:
      'bg-[#0047FF] text-white rounded-full shadow-[0_0_20px_rgba(0,71,255,0.4)] font-medium',
    navInactive:
      'bg-transparent text-white/50 hover:text-white hover:bg-white/[0.05] rounded-full cursor-pointer',
    card: 'rounded-xl md:rounded-2xl border border-[#0047FF]/20 bg-white/[0.03] backdrop-blur-xl',
    cardStrong:
      'rounded-2xl border border-[#0047FF]/25 bg-white/[0.04] backdrop-blur-xl shadow-[0_0_30px_rgba(0,71,255,0.06)]',
    statCard:
      'rounded-2xl border border-[#0047FF]/10 bg-white/[0.02] backdrop-blur-xl px-4 py-5 text-center',
    label: 'text-xs text-[#0047FF] uppercase tracking-[0.28em] font-semibold',
    heading: 'text-4xl md:text-7xl font-bold tracking-tight text-white',
    subheading: 'text-base md:text-lg text-white/60 tracking-tight',
    bodyMuted: 'text-white/55',
    btnPrimary:
      'rounded-xl bg-[#0047FF] font-bold text-white shadow-[0_0_30px_rgba(0,71,255,0.4)] hover:bg-[#003bd9] transition-colors duration-200 cursor-pointer',
    btnSecondary:
      'rounded-xl border border-[#0047FF]/20 bg-[#0047FF]/5 text-white hover:bg-[#0047FF]/10 hover:border-[#0047FF]/50 backdrop-blur-xl transition-colors duration-200 cursor-pointer',
    btnOutline:
      'rounded-xl border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] transition-colors duration-200 cursor-pointer',
    btnCta:
      'rounded-xl bg-[#0047FF] font-bold text-white shadow-[0_0_30px_rgba(0,71,255,0.4)] hover:bg-[#003bd9] transition-colors duration-200 cursor-pointer',
    error:
      'rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 px-4 py-3 text-sm',
    warning:
      'rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 px-4 py-3 text-sm',
    input: 'rounded-xl border border-[#0047FF]/20 bg-white/[0.04] text-white',
    sheet: 'bg-[#00040F] border-[#0047FF]/10',
    tabBar:
      'rounded-2xl backdrop-blur-md bg-black/50 border border-[#0047FF]/15 p-1',
    tabActive: 'bg-[#0047FF] text-white rounded-full',
    tabInactive:
      'text-white/50 hover:text-white hover:bg-white/5 rounded-full cursor-pointer',
    progressTrack: 'bg-white/10 rounded-full h-2',
    connectBtn:
      'rounded-xl bg-[#0047FF] px-9 py-3.5 text-base font-bold text-white shadow-[0_0_30px_rgba(0,71,255,0.4)] cursor-pointer',
  },
  litvm: {
    key: 'litvm',
    accent: '#00F2FE',
    cta: '#00F2FE',
    isLight: false,
    fontMono: true,
    fontSerif: false,
    fontDisplay: false,
    labelPrefix: '>> ',
    labelCase: 'lowercase tracking-[0.28em] font-mono',
    radius: 'rounded-xl',
    radiusSm: 'rounded-lg',
    radiusNav: 'rounded-xl',
    page: 'text-[#E2E8F0] font-mono',
    pageMain: 'relative z-10 min-h-screen pt-24 pb-12 px-4',
    header: 'bg-[#0B192C]/90 backdrop-blur-xl border-b border-[#00F2FE]/10',
    headerFloating:
      'fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl rounded-xl bg-[#0B192C]/90 backdrop-blur-xl border border-[#00F2FE]/15',
    navPill:
      'flex items-center p-1 rounded-xl bg-[#0B192C]/80 border border-[#00F2FE]/15 backdrop-blur-xl',
    navActive:
      'bg-[#00F2FE] text-[#0B192C] rounded-lg shadow-[0_0_20px_rgba(0,242,254,0.3)] font-bold',
    navInactive:
      'bg-transparent text-[#E2E8F0]/50 hover:text-[#00F2FE] hover:bg-[#00F2FE]/5 rounded-lg font-semibold cursor-pointer',
    card: 'rounded-xl md:rounded-2xl border border-[#00F2FE]/20 bg-[#0B192C] backdrop-blur-xl',
    cardStrong: 'litvm-card rounded-xl',
    statCard: 'bg-[#0B192C] border border-[#00F2FE]/20 px-4 py-5 text-center',
    label: 'text-xs text-[#00F2FE] font-mono lowercase tracking-[0.28em]',
    heading: 'text-4xl md:text-7xl font-bold tracking-tight font-mono text-[#00F2FE]',
    subheading: 'text-base md:text-lg text-[#00F2FE]/60 font-mono',
    bodyMuted: 'text-[#E2E8F0]/50',
    btnPrimary:
      'rounded-xl bg-[#00F2FE] font-bold text-[#0B192C] hover:bg-[#00C9DB] shadow-[0_0_30px_rgba(0,242,254,0.4)] font-mono transition-colors duration-200 cursor-pointer',
    btnSecondary:
      'rounded-xl border border-[#00F2FE]/30 bg-[#0B192C] text-[#00F2FE] hover:bg-[#00F2FE]/10 hover:border-[#00F2FE]/50 font-mono transition-colors duration-200 cursor-pointer',
    btnOutline:
      'rounded-xl border border-white/15 bg-transparent text-white/70 hover:border-[#00F2FE]/40 hover:text-white font-mono transition-colors duration-200 cursor-pointer',
    btnCta:
      'rounded-xl bg-[#00F2FE] font-bold text-[#0B192C] hover:bg-[#00C9DB] shadow-[0_0_30px_rgba(0,242,254,0.4)] font-mono transition-colors duration-200 cursor-pointer',
    error:
      'rounded-xl border border-red-500 bg-[#0B192C] text-red-500 font-mono px-4 py-3 text-sm',
    warning:
      'rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 font-mono px-4 py-3 text-sm',
    input: 'rounded-xl border border-[#00F2FE]/15 bg-[#0B192C] text-[#E2E8F0] font-mono',
    sheet: 'bg-[#0B192C] border-[#00F2FE]/15',
    tabBar:
      'rounded-xl backdrop-blur-md bg-[#0B192C]/80 border border-[#00F2FE]/15 p-1',
    tabActive: 'bg-[#00F2FE] text-[#0B192C] rounded-lg font-bold',
    tabInactive:
      'text-[#E2E8F0]/50 hover:text-[#00F2FE] hover:bg-[#00F2FE]/5 rounded-lg cursor-pointer',
    progressTrack: 'bg-white/5 rounded-2xl h-2',
    connectBtn:
      'rounded-xl bg-[#00F2FE] px-9 py-3.5 text-base font-bold text-[#0B192C] font-mono shadow-[0_0_30px_rgba(0,242,254,0.4)] cursor-pointer',
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
    header: 'bg-[#000B24]/90 backdrop-blur-xl border-b border-[#4D8EE9]/10',
    headerFloating:
      'fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl rounded-xl bg-[#000B24]/90 backdrop-blur-xl border border-[#4D8EE9]/15',
    navPill:
      'flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10',
    navActive: 'bg-[#4D8EE9] text-white rounded-lg font-semibold',
    navInactive:
      'bg-transparent text-white/50 hover:text-white hover:bg-white/[0.05] rounded-lg cursor-pointer',
    card: 'arc-card rounded-xl md:rounded-2xl',
    cardStrong: 'arc-card rounded-2xl arc-glow',
    statCard: 'bg-[#000B24] border border-[#4D8EE9]/20 px-4 py-5 text-center',
    label: 'text-xs text-[#4D8EE9] font-mono uppercase tracking-[0.28em]',
    heading: 'text-4xl md:text-7xl font-bold tracking-tight text-white',
    subheading: 'text-base md:text-lg text-[#4D8EE9]/60',
    bodyMuted: 'text-white/50',
    btnPrimary:
      'rounded-xl bg-[#4D8EE9] font-bold text-white hover:bg-[#3A7BD6] shadow-[0_0_30px_rgba(77,142,233,0.4)] transition-colors duration-200 cursor-pointer',
    btnSecondary:
      'rounded-xl border border-[#4D8EE9]/30 bg-[#000B24] text-[#4D8EE9] hover:bg-[#4D8EE9]/10 hover:border-[#4D8EE9]/50 transition-colors duration-200 cursor-pointer',
    btnOutline:
      'rounded-xl border border-white/15 bg-transparent text-white/70 hover:border-[#4D8EE9]/40 hover:text-white transition-colors duration-200 cursor-pointer',
    btnCta:
      'rounded-xl bg-[#4D8EE9] font-bold text-white hover:bg-[#3A7BD6] shadow-[0_0_30px_rgba(77,142,233,0.4)] transition-colors duration-200 cursor-pointer',
    error:
      'rounded-xl border border-red-500 bg-[#000B24] text-red-500 px-4 py-3 text-sm',
    warning:
      'rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 px-4 py-3 text-sm',
    input: 'rounded-xl border border-white/10 bg-[#000B24] text-white',
    sheet: 'bg-[#000B24] border-[#4D8EE9]/15',
    tabBar:
      'rounded-xl backdrop-blur-md bg-black/50 border border-[#4D8EE9]/15 p-1',
    tabActive: 'bg-[#4D8EE9] text-white rounded-lg',
    tabInactive:
      'text-white/50 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer',
    progressTrack: 'bg-white/10 rounded-full h-2',
    connectBtn:
      'rounded-xl bg-[#4D8EE9] px-9 py-3.5 text-base font-bold text-white shadow-[0_0_30px_rgba(77,142,233,0.4)] cursor-pointer',
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
  if (ui.isLight) return 'text-[#0052FF]'
  if (ui.key === 'megaeth') return 'text-[#00ff88]'
  if (ui.key === 'ink') return 'text-[#8b5cf6]'
  if (ui.key === 'unichain') return 'text-[#ff007a]'
  if (ui.key === 'litvm') return 'text-[#00F2FE]'
  if (ui.key === 'arc') return 'text-[#4D8EE9]'
  if (ui.key === 'soneium') return 'text-[#0047FF]'
  if (ui.key === 'default') return 'text-white'
  return 'text-primary'
}
