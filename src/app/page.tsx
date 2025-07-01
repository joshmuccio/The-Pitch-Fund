import Image from 'next/image';
import { SubscribeForm } from '../components/SubscribeForm';
import CTAButton from './components/CTAButton';
import SocialProofLinks from './components/SocialProofLinks';
import PortfolioLink from './components/PortfolioLink';

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

          <CTAButton />
        </div>
      </section>

      {/* Social proof strip */}
      <section className="mx-auto mt-16 max-w-4xl px-6">
        <SocialProofLinks />
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
          <PortfolioLink />
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
