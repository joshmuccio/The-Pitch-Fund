import Link from 'next/link';

export default function Portfolio() {
  return (
    <div className="min-h-screen pt-[72px]">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-pitch-black py-24">
        {/* radial glow */}
        <div className="pointer-events-none absolute inset-0 -z-10
                        bg-[radial-gradient(ellipse_at_top_left,var(--tw-gradient-stops))]
                        from-dawn-gold-start/40 via-dawn-gold-start/10 to-transparent
                        blur-[120px]" />

        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-[-0.04em] mb-6">
            Our <span className="bg-clip-text text-transparent bg-gradient-to-r from-dawn-gold-start to-dawn-gold-end">Portfolio</span>
          </h1>
          <p className="text-xl text-platinum-mist/80 max-w-2xl mx-auto">
            Backing founders you hear on The Pitch. Here are some of the world-class startups we've invested in.
          </p>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="py-24 bg-pitch-black">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Portfolio Item 1 */}
            <div className="bg-graphite-gray/50 rounded-xl p-6 backdrop-blur border border-graphite-gray/20">
              <div className="aspect-square bg-graphite-gray rounded-lg mb-4 flex items-center justify-center">
                <span className="text-platinum-mist/50 text-2xl font-bold">🚀</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Startup Alpha</h3>
              <p className="text-platinum-mist/70 mb-4">Revolutionizing the way teams collaborate with AI-powered project management.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-cobalt-pulse/20 text-cobalt-pulse text-xs rounded">SaaS</span>
                <span className="px-2 py-1 bg-cobalt-pulse/20 text-cobalt-pulse text-xs rounded">AI</span>
              </div>
            </div>

            {/* Portfolio Item 2 */}
            <div className="bg-graphite-gray/50 rounded-xl p-6 backdrop-blur border border-graphite-gray/20">
              <div className="aspect-square bg-graphite-gray rounded-lg mb-4 flex items-center justify-center">
                <span className="text-platinum-mist/50 text-2xl font-bold">💡</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Innovation Labs</h3>
              <p className="text-platinum-mist/70 mb-4">Building the future of sustainable energy with breakthrough battery technology.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-cobalt-pulse/20 text-cobalt-pulse text-xs rounded">Hardware</span>
                <span className="px-2 py-1 bg-cobalt-pulse/20 text-cobalt-pulse text-xs rounded">CleanTech</span>
              </div>
            </div>

            {/* Portfolio Item 3 */}
            <div className="bg-graphite-gray/50 rounded-xl p-6 backdrop-blur border border-graphite-gray/20">
              <div className="aspect-square bg-graphite-gray rounded-lg mb-4 flex items-center justify-center">
                <span className="text-platinum-mist/50 text-2xl font-bold">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Precision Health</h3>
              <p className="text-platinum-mist/70 mb-4">Personalized healthcare solutions powered by advanced genomics and AI.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-cobalt-pulse/20 text-cobalt-pulse text-xs rounded">HealthTech</span>
                <span className="px-2 py-1 bg-cobalt-pulse/20 text-cobalt-pulse text-xs rounded">AI</span>
              </div>
            </div>

            {/* Portfolio Item 4 */}
            <div className="bg-graphite-gray/50 rounded-xl p-6 backdrop-blur border border-graphite-gray/20">
              <div className="aspect-square bg-graphite-gray rounded-lg mb-4 flex items-center justify-center">
                <span className="text-platinum-mist/50 text-2xl font-bold">🌐</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Global Connect</h3>
              <p className="text-platinum-mist/70 mb-4">Connecting remote teams worldwide with seamless communication tools.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-cobalt-pulse/20 text-cobalt-pulse text-xs rounded">SaaS</span>
                <span className="px-2 py-1 bg-cobalt-pulse/20 text-cobalt-pulse text-xs rounded">Remote Work</span>
              </div>
            </div>

            {/* Portfolio Item 5 */}
            <div className="bg-graphite-gray/50 rounded-xl p-6 backdrop-blur border border-graphite-gray/20">
              <div className="aspect-square bg-graphite-gray rounded-lg mb-4 flex items-center justify-center">
                <span className="text-platinum-mist/50 text-2xl font-bold">🔒</span>
              </div>
              <h3 className="text-xl font-bold mb-2">SecureFlow</h3>
              <p className="text-platinum-mist/70 mb-4">Next-generation cybersecurity protecting businesses from evolving threats.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-cobalt-pulse/20 text-cobalt-pulse text-xs rounded">Cybersecurity</span>
                <span className="px-2 py-1 bg-cobalt-pulse/20 text-cobalt-pulse text-xs rounded">Enterprise</span>
              </div>
            </div>

            {/* Portfolio Item 6 */}
            <div className="bg-graphite-gray/50 rounded-xl p-6 backdrop-blur border border-graphite-gray/20">
              <div className="aspect-square bg-graphite-gray rounded-lg mb-4 flex items-center justify-center">
                <span className="text-platinum-mist/50 text-2xl font-bold">📱</span>
              </div>
              <h3 className="text-xl font-bold mb-2">MobileFirst</h3>
              <p className="text-platinum-mist/70 mb-4">Revolutionary mobile app development platform for the next generation.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-cobalt-pulse/20 text-cobalt-pulse text-xs rounded">Mobile</span>
                <span className="px-2 py-1 bg-cobalt-pulse/20 text-cobalt-pulse text-xs rounded">Developer Tools</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-graphite-gray/30">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Want to learn more?</h2>
          <p className="text-xl text-platinum-mist/80 mb-8">
            Get exclusive access to our portfolio companies and founder updates.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/#subscribe"
              className="inline-block rounded-full bg-cobalt-pulse px-8 py-4 text-lg font-semibold text-pitch-black shadow-md transition-transform hover:-translate-y-0.5 hover:shadow-lg"
            >
              Subscribe to Updates
            </Link>
            <Link 
              href="/#about"
              className="inline-block rounded-full border border-cobalt-pulse px-8 py-4 text-lg font-semibold text-cobalt-pulse transition-colors hover:bg-cobalt-pulse hover:text-pitch-black"
            >
              About The Fund
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 