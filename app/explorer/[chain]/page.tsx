import { redirect } from 'next/navigation';
import BubbleExplorer from '@/components/bubble-explorer';

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

export async function generateMetadata({ params }: ExplorerPageProps) {
  const resolvedParams = await params;
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
    title: `${names[resolvedParams.chain]} Explorer — Quiz On Chain`,
    description: `Explore ${names[resolvedParams.chain]} transactions as interactive bubbles`,
  };
}

interface ExplorerPageProps {
  params: Promise<{ chain: string }>;
}

export default async function ExplorerPage({ params }: ExplorerPageProps) {
  const resolvedParams = await params;
  const validChains = ['soneium', 'ink', 'base', 'unichain', 'megaeth', 'litvm', 'arc', 'sepolia'];

  if (!validChains.includes(resolvedParams.chain)) {
    redirect('/explorer');
  }

  const theme = explorerTheme(resolvedParams.chain);

  return (
    <div className={`min-h-screen relative pt-24 pb-12 px-4 safe-top ${theme}`}>
      <BubbleExplorer chain={resolvedParams.chain as any} />
    </div>
  );
}
