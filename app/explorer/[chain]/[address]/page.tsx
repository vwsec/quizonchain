import BubbleExplorer from '@/components/bubble-explorer';
import { redirect } from 'next/navigation';
import { ExplorerBackButton } from '@/components/explorer-back-button';
import { Header } from '@/components/header';
import { WalletProvider } from '@/components/wallet-provider';

interface SubExplorerPageProps {
  params: Promise<{ chain: string; address: string }>;
}

export async function generateMetadata({ params }: SubExplorerPageProps) {
  const resolvedParams = await params;
  const isEns = resolvedParams.address.endsWith('.eth');
  const short = isEns ? resolvedParams.address : `${resolvedParams.address.slice(0,6)}...${resolvedParams.address.slice(-4)}`;
  
  const names: Record<string, string> = { 
    soneium: 'Soneium', 
    ink: 'Ink', 
    base: 'Base', 
    unichain: 'Unichain',
    megaeth: 'MegaETH',
    litvm: 'LitVM'
  };
  
  if (!names[resolvedParams.chain]) {
    return { title: 'Explorer Not Found' };
  }

  return {
    title: `${short} — ${names[resolvedParams.chain]} Explorer`,
    description: `View transactions for ${resolvedParams.address} on ${names[resolvedParams.chain]}`,
  };
}

const activeChain = process.env.NEXT_PUBLIC_ACTIVE_CHAIN;

export default async function SubExplorerPage({ params }: SubExplorerPageProps) {
  const resolvedParams = await params;
  
  if (activeChain && resolvedParams.chain !== activeChain) {
    redirect('/explorer');
  }

  const validChains = ['soneium', 'ink', 'base', 'unichain', 'megaeth', 'litvm'];
  
  if (!validChains.includes(resolvedParams.chain)) {
    redirect('/explorer');
  }

  const isAddress = /^0x[a-fA-F0-9]{40}$/.test(resolvedParams.address);
  const isEns = resolvedParams.address.endsWith('.eth');

  if (!isAddress && !isEns) {
    redirect(`/explorer/${resolvedParams.chain}`);
  }

  const names: Record<string, string> = { 
    soneium: 'Soneium', 
    ink: 'Ink', 
    base: 'Base', 
    unichain: 'Unichain',
    megaeth: 'MegaETH',
    litvm: 'LitVM'
  };
  const isBase = resolvedParams.chain === 'base';
  const isMegaEth = resolvedParams.chain === 'megaeth';
  const isInk = resolvedParams.chain === 'ink';
  const isUnichain = resolvedParams.chain === 'unichain';
  const isSoneium = resolvedParams.chain === 'soneium';
  const isLitvm = resolvedParams.chain === 'litvm';
  const chainName = names[resolvedParams.chain] || (resolvedParams.chain.charAt(0).toUpperCase() + resolvedParams.chain.slice(1));

  return (
    <div className={`min-h-screen relative pt-20 ${
      isBase ? 'bg-white text-black' : 
      isMegaEth ? 'bg-black text-white font-mono' : 
      isInk ? 'bg-[#0a0a0f] text-white' :
      isUnichain ? 'bg-[#0d0014] text-white' :
      isSoneium ? 'bg-[#00040F] text-white' :
      isLitvm ? 'bg-[#0B192C] text-white font-mono' :
      'bg-[#080810] text-white'
    }`}>
      <BubbleExplorer chain={resolvedParams.chain as any} initialAddress={resolvedParams.address} />
    </div>
  );
}
