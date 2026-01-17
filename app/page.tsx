'use client';

import { HeroSection } from '@/components/HeroSection';
import { Navbar } from '@/components/Navbar';

export default function Page() {
  return (
    <div className="h-screen overflow-hidden bg-neutral-100 p-6">
      <div className="h-full bg-black text-white rounded-3xl overflow-hidden">
        <Navbar />
        <HeroSection />
      </div>
    </div>
  );
}
