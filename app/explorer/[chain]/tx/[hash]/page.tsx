import { redirect } from 'next/navigation';
import BubbleExplorer from '@/components/bubble-explorer';
import { ExplorerBackButton } from '@/components/explorer-back-button';
import { Header } from '@/components/header';
import { WalletProvider } from '@/components/wallet-provider';

export default async function TxPage({ params }: { params: Promise<{ chain: string; hash: string }> }) {
  const resolvedParams = await params;
  const validChains = ['soneium', 'ink', 'base', 'unichain', 'megaeth'];
  const validHash = /^0x[a-fA-F0-9]{64}$/i.test(resolvedParams.hash);
  
  if (!validChains.includes(resolvedParams.chain) || !validHash) redirect('/explorer');
  
  const names: Record<string, string> = { soneium: 'Soneium', ink: 'Ink', base: 'Base', unichain: 'Unichain', megaeth: 'MegaETH' };
  const chainName = names[resolvedParams.chain] || (resolvedParams.chain.charAt(0).toUpperCase() + resolvedParams.chain.slice(1));

  return (
    <WalletProvider>
      <div className='min-h-screen bg-[#080810] relative pt-20'>
        <Header />
        <ExplorerBackButton 
          fallbackHref={`/explorer/${resolvedParams.chain}`} 
          label={`Back to ${chainName} Explorer`} 
        />
        <BubbleExplorer chain={resolvedParams.chain as any} initialTxHash={resolvedParams.hash} />
      </div>
    </WalletProvider>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ chain: string; hash: string }> }) {
  const resolvedParams = await params;
  const names: Record<string, string> = { soneium: 'Soneium', ink: 'Ink', base: 'Base', unichain: 'Unichain', megaeth: 'MegaETH' };
  
  if (!names[resolvedParams.chain]) return { title: 'Transaction Explorer' };
  
  const short = `${resolvedParams.hash.slice(0, 6)}...${resolvedParams.hash.slice(-4)}`;
  return {
    title: `Tx ${short} — ${names[resolvedParams.chain]} Explorer`,
    description: `View transaction ${resolvedParams.hash} on ${names[resolvedParams.chain]}`,
  };
}
