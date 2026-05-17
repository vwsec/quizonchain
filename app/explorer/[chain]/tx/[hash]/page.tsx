import { redirect } from 'next/navigation';
import BubbleExplorer from '@/components/bubble-explorer';
import { ExplorerBackButton } from '@/components/explorer-back-button';
import { Header } from '@/components/header';
import { WalletProvider } from '@/components/wallet-provider';

const activeChain = process.env.NEXT_PUBLIC_ACTIVE_CHAIN;

export default async function TxPage({ params }: { params: Promise<{ chain: string; hash: string }> }) {
  const resolvedParams = await params;
  
  if (activeChain && resolvedParams.chain !== activeChain) {
    redirect('/explorer');
  }

  const validChains = ['soneium', 'ink', 'base', 'unichain', 'megaeth', 'litvm'];
  const validHash = /^0x[a-fA-F0-9]{64}$/i.test(resolvedParams.hash);
  
  if (!validChains.includes(resolvedParams.chain) || !validHash) redirect('/explorer');
  
  const names: Record<string, string> = { soneium: 'Soneium', ink: 'Ink', base: 'Base', unichain: 'Unichain', megaeth: 'MegaETH', litvm: 'LitVM' };
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
      <BubbleExplorer chain={resolvedParams.chain as any} initialTxHash={resolvedParams.hash} />
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ chain: string; hash: string }> }) {
  const resolvedParams = await params;
  const names: Record<string, string> = { soneium: 'Soneium', ink: 'Ink', base: 'Base', unichain: 'Unichain', megaeth: 'MegaETH', litvm: 'LitVM' };
  
  if (!names[resolvedParams.chain]) return { title: 'Transaction Explorer' };
  
  const short = `${resolvedParams.hash.slice(0, 6)}...${resolvedParams.hash.slice(-4)}`;
  return {
    title: `Tx ${short} — ${names[resolvedParams.chain]} Explorer`,
    description: `View transaction ${resolvedParams.hash} on ${names[resolvedParams.chain]}`,
  };
}
