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

const activeChain = process.env.NEXT_PUBLIC_ACTIVE_CHAIN;

export default async function ExplorerPage({ params }: ExplorerPageProps) {
  const resolvedParams = await params;
  const validChains = ['soneium', 'ink', 'base', 'unichain', 'megaeth'];
  
  if (activeChain && resolvedParams.chain !== activeChain) {
    redirect('/explorer');
  }

  if (!validChains.includes(resolvedParams.chain)) {
    redirect('/explorer');
  }

  const isBase = resolvedParams.chain === 'base';
  const isMegaEth = resolvedParams.chain === 'megaeth';
  const isInk = resolvedParams.chain === 'ink';
  const isUnichain = resolvedParams.chain === 'unichain';
  const isSoneium = resolvedParams.chain === 'soneium';

  return (
    <WalletProvider>
      <div className={`min-h-screen relative pt-20 ${
        isBase ? 'bg-white text-black' : 
        isMegaEth ? 'bg-black text-white font-mono' : 
        isInk ? 'bg-[#0a0a0f] text-white' :
        isUnichain ? 'bg-[#0d0014] text-white' :
        isSoneium ? 'bg-[#00040F] text-white' :
        'bg-[#080810] text-white'
      }`}>
        <Header />
        <BubbleExplorer chain={resolvedParams.chain as any} />
      </div>
    </WalletProvider>
  );
}
