# Structured Data Enhancement Roadmap

## Current Implementation (v1) ✅

### The Pitch Podcast Schema
- **Type**: `PodcastSeries`
- **Coverage**: Basic podcast information, platform links, RSS feed
- **Social Links**: Apple Podcasts, Spotify, Twitter

### The Pitch Fund Schema  
- **Type**: `InvestmentFund`
- **Coverage**: Fund name, founder, size, inception date
- **Social Links**: Twitter handle

## Future Enhancements (v2) 📋

> **Note**: Good enough for v1 – you can enrich it later with the following enhancements:

### Podcast Enhancements
- [ ] **`hasEpisode`**: Individual podcast episodes with schema markup
  ```json
  "hasEpisode": [
    {
      "@type": "PodcastEpisode",
      "episodeNumber": 1,
      "name": "Episode Title",
      "description": "Episode description",
      "datePublished": "2024-01-15",
      "audio": {
        "@type": "AudioObject",
        "url": "https://audio-url.mp3"
      }
    }
  ]
  ```

### Investment Fund Enhancements
- [ ] **`contactPoint`**: Investment inquiry contact information
  ```json
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Investment Inquiries",
    "email": "invest@thepitch.fund",
    "url": "https://thepitch.fund/contact"
  }
  ```

- [ ] **`foundingDate`**: More detailed founding information beyond inception
- [ ] **`fundingStatus`**: Current fund status and availability
  ```json
  "fundingStatus": "Open for Investment",
  "availableCapital": {
    "@type": "MonetaryAmount", 
    "currency": "USD",
    "value": "2000000"
  }
  ```

### Portfolio Integration
- [ ] **Portfolio Company Schema**: Individual company markup
  ```json
  "portfolio": [
    {
      "@type": "Organization",
      "name": "Portfolio Company Name",
      "url": "https://company.com",
      "foundingDate": "2023-06-15",
      "industry": "Technology"
    }
  ]
  ```

- [ ] **`investmentStrategy`**: Detailed investment focus areas
  ```json
  "investmentStrategy": [
    "Early-stage startups",
    "Podcast-featured companies", 
    "B2B SaaS",
    "Consumer technology"
  ]
  ```

### Enhanced Organization Schema
- [ ] **Address Information**: Physical location if relevant
- [ ] **Employee Count**: Team size information
- [ ] **Awards & Recognition**: Industry recognition
- [ ] **Financial Information**: More detailed fund metrics

## Implementation Priority

### Phase 1 (High Priority)
1. `contactPoint` - Essential for investment inquiries
2. `hasEpisode` - Major SEO benefit for podcast discovery
3. Portfolio company schema - Core business value

### Phase 2 (Medium Priority)  
1. Enhanced `investmentStrategy` details
2. `fundingStatus` and availability information
3. More detailed founding information

### Phase 3 (Low Priority)
1. Address and location information
2. Awards and recognition
3. Advanced financial metrics

## Technical Notes

- All enhancements should maintain existing schema structure
- Test with Google's Rich Results Test after each enhancement
- Consider performance impact of larger JSON-LD payloads
- Ensure data accuracy before implementation
- Document data sources for dynamic content 