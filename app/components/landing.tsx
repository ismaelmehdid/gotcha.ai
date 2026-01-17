'use client';

import { HeroSection } from '@/components/hero-section';
import { Navbar } from '@/components/navbar';

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
    </div>
  );
}
