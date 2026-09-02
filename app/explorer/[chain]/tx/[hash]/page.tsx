import { redirect } from 'next/navigation';
import BubbleExplorer from '@/components/bubble-explorer';
import { ExplorerBackButton } from '@/components/explorer-back-button';

// Static shell, data loads client-side. ISR: at most one server render per URL per hour.
export const revalidate = 3600

export default async function TxPage({ params }: { params: Promise<{ chain: string; hash: string }> }) {
  const resolvedParams = await params;
  
  const validChains = ['soneium', 'ink', 'base', 'unichain', 'megaeth', 'litvm', 'arc', 'sepolia'];
  const validHash = /^0x[a-fA-F0-9]{64}$/i.test(resolvedParams.hash);
  
  if (!validChains.includes(resolvedParams.chain) || !validHash) redirect('/explorer');
  
  const names: Record<string, string> = { soneium: 'Soneium', ink: 'Ink', base: 'Base', unichain: 'Unichain', megaeth: 'MegaETH', litvm: 'LitVM', arc: 'Arc Testnet', sepolia: 'Sepolia' };
  const isBase = resolvedParams.chain === 'base';
  const isMegaEth = resolvedParams.chain === 'megaeth';
  const isInk = resolvedParams.chain === 'ink';
  const isUnichain = resolvedParams.chain === 'unichain';
  const isSoneium = resolvedParams.chain === 'soneium';
  const isLitvm = resolvedParams.chain === 'litvm';
  const isArc = resolvedParams.chain === 'arc';
  const chainName = names[resolvedParams.chain] || (resolvedParams.chain.charAt(0).toUpperCase() + resolvedParams.chain.slice(1));

  return (
    <div className={`min-h-screen relative pt-[76px] md:pt-[84px] ${
      isBase ? 'bg-white text-black' : 
      isMegaEth ? 'bg-black text-white font-mono' : 
      isInk ? 'bg-[#0a0a0f] text-white' :
      isUnichain ? 'bg-[#0d0014] text-white' :
      isSoneium ? 'bg-[#00040F] text-white' :
      isLitvm ? 'bg-[#0B192C] text-white font-mono' :
      isArc ? 'bg-[#000B24] text-white' :
      'bg-[#080810] text-white'
    }`}>
      <BubbleExplorer chain={resolvedParams.chain as any} initialTxHash={resolvedParams.hash} />
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ chain: string; hash: string }> }) {
  const resolvedParams = await params;
  const names: Record<string, string> = { soneium: 'Soneium', ink: 'Ink', base: 'Base', unichain: 'Unichain', megaeth: 'MegaETH', litvm: 'LitVM', arc: 'Arc Testnet', sepolia: 'Sepolia' };
  
  if (!names[resolvedParams.chain]) return { title: 'Transaction Explorer' };
  
  const short = `${resolvedParams.hash.slice(0, 6)}...${resolvedParams.hash.slice(-4)}`;
  return {
    title: `Tx ${short} — ${names[resolvedParams.chain]} Explorer`,
    description: `View transaction ${resolvedParams.hash} on ${names[resolvedParams.chain]}`,
  };
}
