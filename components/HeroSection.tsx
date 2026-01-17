import { SplineScene } from '@/components/ui/splite';
import { Spotlight } from '@/components/ui/spotlight';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" />

      <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div className="relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-400">
              24/7 Shoplifting detection agent
            </span>
          </h1>

          <div className="mt-8 w-full aspect-video bg-neutral-900 rounded-lg border border-white/10 flex items-center justify-center">
            <span className="text-neutral-500 text-sm">GIF placeholder</span>
          </div>
        </div>

        <div className="relative h-[600px] rounded-lg overflow-hidden border border-white/10">
          <SplineScene
            scene="https://prod.spline.design/tAuuq5nYZh5L3CiQ/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>
    </section>
  );
}
