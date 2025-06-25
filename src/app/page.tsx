import * as React from 'react';

// Homepage component using our brand system
function Homepage() {
  return (
    <div className="min-h-screen bg-pitch-black">
      {/* Hero Section with Dawn Gradient */}
      <section className="relative overflow-hidden section-padding">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-radial-dawn opacity-10 blur-3xl" />
        <div className="absolute inset-0 bg-grid" />
        
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main headline */}
            <h1 className="mb-6 text-gradient-dawn fade-in">
              The Pitch Fund
            </h1>
            
            {/* Subheadline */}
            <p className="text-heading-md text-platinum-mist/90 mb-8 max-w-2xl mx-auto leading-relaxed slide-up">
              Connecting innovative companies with smart capital through transparent, investor-grade insights.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 slide-up">
              <button className="btn-primary btn-lg group">
                <span>Request Intro</span>
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              
              <button className="btn-secondary btn-lg">
                Browse Portfolio
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="section-padding bg-graphite-gray/20">
        <div className="container-custom">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card-hover text-center">
              <div className="w-12 h-12 bg-cobalt-pulse/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-cobalt-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="mb-3">Portfolio Insights</h3>
              <p className="text-platinum-mist/70">
                Access detailed company profiles, metrics, and founder updates in our secure LP portal.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="card-hover text-center">
              <div className="w-12 h-12 bg-dawn-gold-light/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-dawn-gold-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="mb-3">LP Network</h3>
              <p className="text-platinum-mist/70">
                Join our community of experienced Limited Partners and access exclusive opportunities.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="card-hover text-center">
              <div className="w-12 h-12 bg-cobalt-pulse/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-cobalt-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="mb-3">Deal Flow</h3>
              <p className="text-platinum-mist/70">
                Discover innovative startups from our curated pipeline and podcast network.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="mb-12">Trusted by Innovative Companies</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="card text-center">
                <div className="text-heading-lg text-cobalt-pulse mb-2">50+</div>
                <div className="text-platinum-mist/70">Portfolio Companies</div>
              </div>
              <div className="card text-center">
                <div className="text-heading-lg text-dawn-gold-light mb-2">$100M+</div>
                <div className="text-platinum-mist/70">Capital Deployed</div>
              </div>
              <div className="card text-center">
                <div className="text-heading-lg text-cobalt-pulse mb-2">25+</div>
                <div className="text-platinum-mist/70">Limited Partners</div>
              </div>
              <div className="card text-center">
                <div className="text-heading-lg text-dawn-gold-light mb-2">95%</div>
                <div className="text-platinum-mist/70">LP Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Homepage;