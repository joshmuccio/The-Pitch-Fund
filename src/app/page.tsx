import Image from 'next/image';
import Link from 'next/link';
import { SubscribeForm } from '../components/SubscribeForm';

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section
        className="hero-section relative isolate overflow-hidden
                   flex flex-col items-center justify-center
                   pt-[72px] px-6"
      >
        {/* radial glow */}
        <div className="pointer-events-none absolute inset-0 -z-10
                        bg-[radial-gradient(ellipse_at_top_left,var(--tw-gradient-stops))]
                        from-dawn-gold-start/40 via-dawn-gold-start/10 to-transparent
                        blur-[120px]" />

        <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-[-0.04em]">
            Investing in <span className="bg-clip-text text-transparent bg-gradient-to-r from-dawn-gold-start to-dawn-gold-end">world-class&nbsp;startups</span><br />
            you hear on <em>The&nbsp;Pitch</em>
          </h1>

          <p className="text-xl md:text-2xl text-platinum-mist/80">
            Backed by 600K subscribers • Built for long-term value
          </p>

          <a href="#subscribe"
             className="inline-block rounded-full bg-cobalt-pulse px-10 py-4 text-lg font-semibold text-pitch-black shadow-md transition-transform hover:-translate-y-0.5 hover:shadow-lg">
            Get Fund Updates
          </a>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="mx-auto mt-16 max-w-4xl px-6">
        <div className="flex flex-col items-center justify-center gap-6
                        rounded-xl bg-graphite-gray/60 py-6 backdrop-blur
                        md:flex-row md:gap-12">
          
          {/* ★ 4.6 → Apple Podcasts */}
          <a
            href="https://podcasts.apple.com/us/podcast/the-pitch/id1008577710?itsct=podcast_box&itscg=30200&ls=1&at=1001l39MA&mt=2"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition-colors hover:text-cobalt-pulse"
            aria-label="The Pitch on Apple Podcasts (4.6 stars)"
          >
            <span className="text-xl font-semibold">★ 4.6</span>
            <span className="text-sm">on Apple Podcasts</span>
          </a>

          <span className="hidden h-6 w-px bg-platinum-mist/20 md:block" />

          <a href="https://open.spotify.com/show/0L04op9D76TOfmzm7yOf9T"
             target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-2 transition-colors hover:text-cobalt-pulse">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M12 0C5.373 0 0 5.373 0 12c0 6.628 5.373 12 12 12s12-5.372 12-12c0-6.627-5.373-12-12-12zm5.342 17.338a.748.748 0 01-1.029.24c-2.81-1.718-6.351-2.106-10.518-1.153a.75.75 0 01-.34-1.463c4.548-1.056 8.45-.624 11.595 1.281.355.217.466.684.292 1.095zm1.47-3.083a.937.937 0 01-1.286.29c-3.212-1.982-8.102-2.557-11.903-1.39a.938.938 0 11-.551-1.792c4.28-1.318 9.634-.678 13.342 1.55.447.276.59.861.398 1.342zm.146-3.304C15.72 8.47 8.28 8.24 5.248 9.12a1.125 1.125 0 11-.654-2.155c3.515-1.066 11.726-.795 15.923 1.745a1.125 1.125 0 01-1.157 1.94z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">Listen on Spotify</span>
          </a>

          <span className="hidden h-6 w-px bg-platinum-mist/20 md:block" />

          <div className="text-sm text-platinum-mist/80">
            <span className="font-semibold text-platinum-mist">250,000+</span> monthly listeners
          </div>
        </div>
      </section>

      {/* Portfolio teaser */}
      <section id="portfolio" className="mx-auto max-w-5xl px-6 py-24">
        <h3 className="text-2xl font-bold mb-8">Portfolio Highlights</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {/* Placeholder tiles */}
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="aspect-square rounded-xl bg-graphite-gray flex items-center justify-center">
              <span className="text-platinum-mist/50">Logo {i}</span>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/portfolio" className="inline-block text-cobalt-pulse hover:underline">
            View full portfolio →
          </Link>
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-graphite-gray/50 py-28 md:py-32">
        <div className="mx-auto max-w-2xl px-6">
          <article className="prose prose-invert pl-4">
            <h3>Why The Pitch Fund?</h3>

            <ul>
              <li>
                We've spent the last decade bringing founders &amp; investors together on the top-rated podcast
                <em>The&nbsp;Pitch</em>.
              </li>
              <li>
                Our microphone now powers our sourcing edge—giving LPs access to deals
                before the crowd even hears them.
              </li>
              <li>
                We invest with <strong>integrity</strong>, <strong>transparency</strong>, and a bias for breakout potential.
              </li>
              <li>
                <strong>Proven track record</strong>: portfolio companies have gone on to raise significant follow-on
                funding and achieve meaningful exits.
              </li>
            </ul>
          </article>
        </div>
      </section>

      {/* Subscribe */}
      <section id="subscribe" className="py-24">
        <div className="mx-auto max-w-md px-6 text-center">
          <h3 className="text-2xl font-bold mb-4">Stay in the loop</h3>
          <p className="mb-6 text-platinum-mist/80">
            Monthly fund updates, founder stories, and episode drops—no spam.
          </p>
          <SubscribeForm />
        </div>
      </section>
    </div>
  );
}
