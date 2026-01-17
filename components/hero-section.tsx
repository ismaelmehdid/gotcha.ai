'use client';

import { useEffect, useRef, useState } from 'react';
import { DottedSurface } from '@/components/ui/dotted-surface';

const features = [
  {
    id: '1',
    title: 'Real-time Detection',
    description:
      'AI-powered monitoring system that watches your store 24/7, detecting suspicious behavior instantly.',
    imageUrl: '/landing-preview.gif',
    bgColor: 'bg-lime-500/10',
    textColor: 'text-white',
  },
  {
    id: '2',
    title: 'Instant Alerts',
    description:
      'Get notified immediately when suspicious activity is detected. Never miss a critical moment.',
    imageUrl: '/notifications.png',
    bgColor: 'bg-green-500/10',
    textColor: 'text-white',
  },
  {
    id: '3',
    title: 'Analytics Dashboard',
    description:
      'Track incidents, patterns, and trends with comprehensive analytics and reporting.',
    imageUrl:
      '/analytics.png',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-white',
  },
];

const useScrollAnimation = () => {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return { ref, inView };
};

const AnimatedHeader = () => {
  const { ref: headerRef, inView: headerInView } = useScrollAnimation();
  const { ref: pRef, inView: pInView } = useScrollAnimation();

  return (
    <div className="text-center max-w-3xl mx-auto mb-16">
      <h1
        ref={headerRef as React.RefObject<HTMLHeadingElement>}
        className={`text-5xl md:text-7xl font-bold transition-all duration-700 ease-out text-white ${headerInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        24/7 Shoplifting detection agent
      </h1>
      <p
        ref={pRef as React.RefObject<HTMLParagraphElement>}
        className={`text-xl text-neutral-400 mt-6 transition-all duration-700 ease-out delay-200 ${pInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        AI-powered security that never sleeps
      </p>
    </div>
  );
};

export function HeroSection() {
  return (
    <section className="relative min-h-screen">
      <DottedSurface />

      <div className="relative z-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="py-24 md:py-32 flex flex-col items-center">
            <AnimatedHeader />

            <div className="w-full">
              {features.map((feature) => (
                <div
                  key={feature.id}
                  className="relative grid grid-cols-1 md:grid-cols-2 items-center gap-8 p-8 md:p-12 mb-16 sticky"
                  style={{
                    top: '200px',
                    backgroundColor: 'rgba(15, 15, 15, 0.9)',
                    backgroundImage: `
                      linear-gradient(rgba(180, 255, 180, 0.05) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(180, 255, 180, 0.05) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px',
                    boxShadow:
                      '0 0 20px rgba(132, 204, 22, 0.15), 0 0 40px rgba(132, 204, 22, 0.08)',
                  }}
                >
                  <div
                    className="absolute inset-0 border-2 border-lime-500/50"
                    style={{
                      animation: 'border-pulse 6s linear infinite',
                    }}
                  />

                  <div className="flex flex-col justify-center relative z-20">
                    <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">
                      {feature.title}
                    </h3>
                    <p className={feature.textColor}>{feature.description}</p>
                  </div>

                  <div className="mt-8 md:mt-0 relative z-20">
                    <div className="w-full aspect-video bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center border border-lime-500/30 overflow-hidden">
                      <img
                        src={feature.imageUrl}
                        alt={feature.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
