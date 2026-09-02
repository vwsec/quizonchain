import { redirect } from 'next/navigation';
import BubbleExplorer from '@/components/bubble-explorer';
import { ExplorerBackButton } from '@/components/explorer-back-button';

// Static shell, data loads client-side. ISR: at most one server render per URL per hour.
export const revalidate = 3600;

const explorerTheme = (chain: string): string => {
  if (chain === 'base') return 'bg-white text-black';
  if (chain === 'megaeth') return 'bg-black text-white font-mono';
  if (chain === 'ink') return 'bg-[#0a0a0f] text-white';
  if (chain === 'unichain') return 'bg-[#0d0014] text-white';
  if (chain === 'soneium') return 'bg-[#00040F] text-white';
  if (chain === 'litvm') return 'bg-[#0B192C] text-white font-mono';
  if (chain === 'arc') return 'bg-[#000B24] text-white';
  return 'bg-[#080810] text-white';
};

export default async function TxPage({ params }: { params: Promise<{ chain: string; hash: string }> }) {
  const resolvedParams = await params;

  const validChains = ['soneium', 'ink', 'base', 'unichain', 'megaeth', 'litvm', 'arc', 'sepolia'];
  const validHash = /^0x[a-fA-F0-9]{64}$/i.test(resolvedParams.hash);

  if (!validChains.includes(resolvedParams.chain) || !validHash) redirect('/explorer');

  return (
    <div className={`min-h-screen relative pt-24 pb-12 px-4 safe-top ${explorerTheme(resolvedParams.chain)}`}>
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
