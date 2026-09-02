import BubbleExplorer from '@/components/bubble-explorer';
import { redirect } from 'next/navigation';

// Static shell, data loads client-side. ISR: at most one server render per URL per hour.
export const revalidate = 3600;

interface SubExplorerPageProps {
  params: Promise<{ chain: string; address: string }>;
}

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
    litvm: 'LitVM',
    arc: 'Arc Testnet',
    sepolia: 'Sepolia'
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

  const validChains = ['soneium', 'ink', 'base', 'unichain', 'megaeth', 'litvm', 'arc', 'sepolia'];

  if (!validChains.includes(resolvedParams.chain)) {
    redirect('/explorer');
  }

  const isAddress = /^0x[a-fA-F0-9]{40}$/.test(resolvedParams.address);
  const isEns = resolvedParams.address.endsWith('.eth');

  if (!isAddress && !isEns) {
    redirect(`/explorer/${resolvedParams.chain}`);
  }

  const theme = explorerTheme(resolvedParams.chain);

  return (
    <div className={`min-h-screen relative pt-24 pb-12 px-4 safe-top ${theme}`}>
      <BubbleExplorer chain={resolvedParams.chain as any} initialAddress={resolvedParams.address} />
    </div>
  );
}
