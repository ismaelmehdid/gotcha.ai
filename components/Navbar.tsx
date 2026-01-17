export function Navbar() {
  return (
    <nav className="absolute top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-full pl-2 pr-5 py-2">
          <div className="w-8 h-8 bg-neutral-200 rounded-full"></div>
          <span className="text-lg font-bold text-black">GOTCHA.AI</span>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-2">
          <a
            href="#product"
            className="px-6 py-2 text-sm text-neutral-700 hover:text-black transition-colors rounded-full hover:bg-white"
          >
            Product
          </a>
          <a
            href="#vision"
            className="px-6 py-2 text-sm text-neutral-700 hover:text-black transition-colors rounded-full hover:bg-white"
          >
            Vision
          </a>
          <a
            href="#benefits"
            className="px-6 py-2 text-sm text-neutral-700 hover:text-black transition-colors rounded-full hover:bg-white"
          >
            Benefits
          </a>
        </div>

        <button className="px-6 py-2.5 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-sm font-medium rounded-full hover:opacity-90 transition-opacity flex items-center gap-2">
          Book a demo
          <span className="text-lg">→</span>
        </button>
      </div>
    </nav>
  );
}
