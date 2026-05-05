import BubbleExplorer from '@/components/bubble-explorer';
import { redirect } from 'next/navigation';
import { ExplorerBackButton } from '@/components/explorer-back-button';
import { Header } from '@/components/header';
import { WalletProvider } from '@/components/wallet-provider';

interface SubExplorerPageProps {
  params: { chain: string; address: string };
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
    megaeth: 'MegaETH'
  };
  
  if (!names[resolvedParams.chain]) {
    return { title: 'Explorer Not Found' };
  }

  return {
    title: `${short} — ${names[resolvedParams.chain]} Explorer`,
    description: `View transactions for ${resolvedParams.address} on ${names[resolvedParams.chain]}`,
  };
}

export default async function SubExplorerPage({ params }: SubExplorerPageProps) {
  const resolvedParams = await params;
  const validChains = ['soneium', 'ink', 'base', 'unichain', 'megaeth'];
  
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
    megaeth: 'MegaETH'
  };
  const chainName = names[resolvedParams.chain] || (resolvedParams.chain.charAt(0).toUpperCase() + resolvedParams.chain.slice(1));

  return (
    <WalletProvider>
      <div className='min-h-screen bg-[#080810] relative text-white pt-20'>
        <Header />
        <ExplorerBackButton 
          fallbackHref={`/explorer/${resolvedParams.chain}`} 
          label={`Back to ${chainName} Explorer`} 
        />
        <BubbleExplorer chain={resolvedParams.chain as any} initialAddress={resolvedParams.address} />
      </div>
    </WalletProvider>
  );
}
