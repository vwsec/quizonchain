import BubbleExplorer from '@/components/bubble-explorer';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { WalletProvider } from '@/components/wallet-provider';

interface ExplorerPageProps {
  params: { chain: string };
}

export async function generateMetadata({ params }: ExplorerPageProps) {
  const resolvedParams = await params;
  const names: Record<string, string> = { 
    soneium: 'Soneium', 
    ink: 'Ink', 
    base: 'Base', 
    unichain: 'Unichain',
    megaeth: 'MegaETH'
  };
  
  if (!names[resolvedParams.chain]) {
    return { title: 'Explorer Not Found' };
  }

  return {
    title: `${names[resolvedParams.chain]} Explorer — Quiz On Chain`,
    description: `Explore ${names[resolvedParams.chain]} transactions as interactive bubbles`,
  };
}

export default async function ExplorerPage({ params }: ExplorerPageProps) {
  const resolvedParams = await params;
  const validChains = ['soneium', 'ink', 'base', 'unichain', 'megaeth'];
  
  if (!validChains.includes(resolvedParams.chain)) {
    redirect('/explorer');
  }

  const isBase = resolvedParams.chain === 'base';
  const isMegaEth = resolvedParams.chain === 'megaeth';
  const isInk = resolvedParams.chain === 'ink';
  const isUnichain = resolvedParams.chain === 'unichain';

  return (
    <WalletProvider>
      <div className={`min-h-screen relative pt-20 ${
        isBase ? 'bg-white text-black' : 
        isMegaEth ? 'bg-black text-white font-mono' : 
        isInk ? 'bg-[#0a0a0f] text-white' :
        isUnichain ? 'bg-[#0d0014] text-white' :
        'bg-[#080810] text-white'
      }`}>
        <Header />
        <div className="absolute top-24 left-6 z-50">
          <Link 
            href="/explorer" 
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium transition-all text-gray-300 hover:text-white backdrop-blur-md"
          >
            <span>←</span> Explorer
          </Link>
        </div>
        <BubbleExplorer chain={resolvedParams.chain as any} />
      </div>
    </WalletProvider>
  );
}
