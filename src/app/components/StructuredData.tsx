import React from "react";

export default function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      /* ------------  The Pitch podcast  ----------- */
      {
        "@type": "PodcastSeries",
        "@id": "https://thepitch.show/#series",
        "name": "The Pitch",
        "url": "https://thepitch.show/",
        "inLanguage": "en-US",
        "genre": "Business, Entrepreneurship, Startups",
        "description": "Founders pitch to real investors. Behind-the-scenes of raising a round.",
        "publisher": {
          "@type": "Organization",
          "name": "The Pitch",
          "logo": {
            "@type": "ImageObject",
            "url": "https://thepitch.show/icon.png"
          }
        },
        "image": "https://thepitch.show/cover-art.png",
        "sameAs": [
          "https://podcasts.apple.com/us/podcast/the-pitch/id1008577710",
          "https://open.spotify.com/show/0L04op9D76TOfmzm7yOf9T",
          "https://twitter.com/ThePitchShow"
        ],
        "webFeed": "https://feeds.megaphone.fm/thepitch"
      },

      /* ------------  The Pitch Fund  --------------- */
      {
        "@type": "InvestmentFund",
        "@id": "https://thepitch.fund/#fund",
        "name": "The Pitch Fund",
        "url": "https://thepitch.fund/",
        "description": "A community-powered venture fund backing founders featured on The Pitch.",
        "founder": {
          "@type": "Person",
          "name": "Josh Muccio",
          "url": "https://twitter.com/jmuccio"
        },
        "inceptionDate": "2024-01-15",
        "isPubliclyTraded": false,
        "assetManager": { "@id": "https://thepitch.fund/#fund" },
        "fundSize": {
          "@type": "MonetaryAmount",
          "currency": "USD",
          "value": "10000000"
        },
        "logo": "https://thepitch.fund/logo.svg",
        "sameAs": [
          "https://twitter.com/thepitchfund"
        ]
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
} 