import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { GlassButton } from '@/components/ui/glass-button';

export function Navbar() {
  const router = useRouter();

  return (
    <nav className="fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto  py-6 flex items-center justify-between">
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-lime-400/30 pl-2 pr-5 py-2 shadow-[0_8px_32px_0_rgba(163,230,53,0.15)]">
          <Image
            src="/logo.png"
            alt="GOTCHA.AI Logo"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="text-lg font-bold text-white">GOTCHA.AI</span>
        </div>

        <GlassButton
          size="sm"
          className="flex items-center gap-2"
          onClick={() => router.push('/dashboard')}
        >
          Dashboard
          <span className="text-lg">→</span>
        </GlassButton>
      </div>
    </nav>
  );
}
