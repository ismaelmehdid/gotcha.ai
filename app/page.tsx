'use client';

import { HeroSection } from '@/components/hero-section';
import { Navbar } from '@/components/navbar';

export default function Page() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
    </div>
  );
}
