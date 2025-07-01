'use client';

import { track } from '@vercel/analytics';

export default function SocialProofLinks() {
  const handlePodcastClick = (platform: string) => {
    track('podcast_link_click', { 
      platform,
      location: 'homepage_social_proof' 
    });
  };

  return (
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
        onClick={() => handlePodcastClick('apple_podcasts')}
      >
        <span className="text-xl font-semibold">★ 4.6</span>
        <span className="text-sm">on Apple Podcasts</span>
      </a>

      <span className="hidden h-6 w-px bg-platinum-mist/20 md:block" />

      <a 
        href="https://open.spotify.com/show/0L04op9D76TOfmzm7yOf9T"
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 transition-colors hover:text-cobalt-pulse"
        onClick={() => handlePodcastClick('spotify')}
      >
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
  );
} 