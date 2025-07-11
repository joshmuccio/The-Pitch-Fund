# 🗺️ Mapbox Geocoding Integration Guide

Complete guide for address normalization and geocoding using Mapbox API in The Pitch Fund application.

## Overview

The Mapbox integration provides automatic address normalization and geocoding for company headquarters locations. When users enter address information, the system automatically:

1. **Normalizes** addresses to standard formats
2. **Geocodes** addresses to precise latitude/longitude coordinates
3. **Validates** address accuracy with confidence scoring
4. **Fallbacks** to regex parsing when Mapbox is unavailable

---

## Features

### Address Normalization
- **Standardized Formatting**: Converts various address formats to consistent structure
- **Component Extraction**: Separates street, city, state, postal code, and country
- **Quality Scoring**: Provides relevance scores for address accuracy

### Geocoding
- **Precise Coordinates**: Extracts latitude/longitude with 8-decimal precision
- **Rooftop Accuracy**: Pinpoints exact building locations when available
- **Global Coverage**: Supports addresses worldwide with varying detail levels

### User Experience
- **Seamless Integration**: Works within existing QuickPaste workflow
- **Visual Feedback**: Color-coded borders indicate parsing method and confidence
- **Automatic Population**: Fills all address fields and coordinates simultaneously

---

## Setup Instructions

### 1. Environment Configuration

Add your Mapbox public token to environment variables:

```env
# .env.local
NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN=pk.your-mapbox-public-token
```

### 2. Get Mapbox Token

1. **Create Account**: Visit [mapbox.com](https://mapbox.com/) and sign up
2. **Access Tokens**: Navigate to Account → Access Tokens
3. **Create Token**: Create a new public token or use the default
4. **Copy Token**: Add to your environment file

### 3. Verify Configuration

```bash
# Check environment variable is loaded
echo $NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN

# Start development server
npm run dev

# Test address normalization in the investment form
```

---

## Implementation Details

### Core Components

#### Address Normalization Function
```typescript
// src/lib/normalizeAddress.ts
export async function normaliseWithMapbox(
  address: string
): Promise<NormalisedAddress | null>
```

**Features:**
- Calls Mapbox Geocoding API v5
- Extracts standardized address components
- Returns coordinates with relevance score
- Handles API errors gracefully

#### QuickPaste Integration
```typescript
// src/lib/parseFounderDiligence.ts
export async function parseDiligenceBlob(
  textBlob: string
): Promise<ParsedDiligenceData>
```

**Workflow:**
1. Extract raw address from text blob
2. Attempt Mapbox normalization
3. Fallback to regex parsing if needed
4. Return complete parsed data

### Database Schema

#### Coordinate Fields
```sql
-- Companies table
ALTER TABLE companies ADD COLUMN hq_latitude numeric(10,8);
ALTER TABLE companies ADD COLUMN hq_longitude numeric(11,8);

-- Performance index
CREATE INDEX idx_companies_hq_coordinates ON companies(hq_latitude, hq_longitude);
```

**Precision:**
- **Latitude**: 10 digits total, 8 decimal places
- **Longitude**: 11 digits total, 8 decimal places  
- **Accuracy**: ~1.1 meter precision globally

---

## Usage Guide

### QuickPaste Workflow

1. **Paste Address Data**: User pastes founder diligence text containing address
2. **Automatic Processing**: System extracts and normalizes address via Mapbox
3. **Visual Feedback**: Form fields show color-coded borders based on processing method
4. **Coordinate Population**: Latitude/longitude fields automatically filled

### Processing Methods

#### 🟢 Mapbox Success (Green Border)
- **High Confidence**: Relevance score ≥ 0.75
- **Accurate Geocoding**: Precise coordinates extracted
- **Standardized Format**: Professional address formatting

#### 🟡 Mapbox Low Confidence (Yellow Border)  
- **Low Confidence**: Relevance score < 0.75
- **Approximate Geocoding**: Coordinates may be less precise
- **Review Recommended**: User should verify address accuracy

#### 🟠 Regex Fallback (Orange Border)
- **Mapbox Unavailable**: API error or no token provided
- **Pattern Matching**: Uses regex to parse common address formats
- **No Coordinates**: Latitude/longitude fields remain empty

#### 🔴 Manual Entry (Red Border)
- **Parsing Failed**: Neither Mapbox nor regex could parse address
- **User Input Required**: Manual entry needed for all fields

### Form Field Behavior

#### Address Fields
- **Auto-populated**: Filled automatically from parsing results
- **Editable**: Users can modify after auto-population
- **Visual Indicators**: Border colors show processing method

#### Coordinate Fields
- **Auto-populated**: Filled from Mapbox geocoding results
- **Read-only**: Users cannot manually edit coordinates
- **Labeled**: Clear indication of auto-population source

---

## API Reference

### Mapbox Geocoding API

#### Request Format
```
GET https://api.mapbox.com/geocoding/v5/mapbox.places/{address}.json
```

#### Parameters
- `access_token`: Your Mapbox public token
- `limit`: 1 (single result)
- `types`: address (specific address types only)

#### Response Structure
```json
{
  "type": "FeatureCollection",
  "features": [{
    "place_name": "1401 21st Street, Sacramento, California 95811, United States",
    "center": [-121.480357, 38.571654],
    "geometry": {
      "coordinates": [-121.480357, 38.571654]
    },
    "relevance": 0.931429,
    "context": [
      {"id": "postcode.319123180", "text": "95811"},
      {"id": "place.287549676", "text": "Sacramento"},
      {"id": "region.419052", "text": "California", "short_code": "US-CA"},
      {"id": "country.8940", "text": "United States", "short_code": "us"}
    ]
  }]
}
```

### Data Extraction

#### Address Components
```typescript
interface NormalisedAddress {
  line1: string;        // Street address
  line2?: string;       // Secondary address
  city: string;         // City name
  state: string;        // State/province
  postal_code: string;  // ZIP/postal code
  country: string;      // Country code (ISO 3166-1 alpha-2)
  lat: number;          // Latitude coordinate
  lon: number;          // Longitude coordinate
  relevance: number;    // Confidence score (0-1)
}
```

#### Coordinate Precision
- **Latitude**: -90 to +90 degrees
- **Longitude**: -180 to +180 degrees
- **Precision**: 8 decimal places (~1.1 meter accuracy)

---

## Error Handling

### API Failures

#### Network Errors
```typescript
// Automatic fallback to regex parsing
if (!mapboxResult) {
  return parseAddressWithRegex(address);
}
```

#### Invalid Responses
```typescript
// Validation of API response structure
if (!response.features || response.features.length === 0) {
  throw new Error('No geocoding results found');
}
```

#### Rate Limiting
- **Free Tier**: 100,000 requests/month
- **Automatic Retry**: Built-in retry logic for temporary failures
- **Graceful Degradation**: Fallback to regex when quota exceeded

### Fallback Strategies

#### 1. Regex Pattern Matching
```typescript
// Multiple address format patterns
const patterns = [
  /^(.+?),\s*(.+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?),?\s*(.+?)$/,
  /^(.+?),\s*(.+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/,
  // ... additional patterns
];
```

#### 2. Field-by-Field Parsing
```typescript
// Extract individual components when full parsing fails
const addressComponents = {
  line1: extractStreetAddress(input),
  city: extractCity(input),
  state: extractState(input),
  // ...
};
```

---

## Performance Considerations

### API Optimization

#### Request Efficiency
- **Single Request**: One API call per address
- **Batch Processing**: Not implemented (would require permanent endpoint)
- **Caching**: Browser-level caching for repeated requests

#### Response Size
- **Minimal Data**: Only essential fields requested
- **Compressed**: Gzip compression for API responses
- **Structured**: JSON format for fast parsing

### Database Storage

#### Coordinate Storage
```sql
-- Optimized numeric types
hq_latitude numeric(10,8)   -- 4 bytes storage
hq_longitude numeric(11,8)  -- 4 bytes storage

-- Efficient indexing
CREATE INDEX idx_companies_hq_coordinates ON companies(hq_latitude, hq_longitude);
```

#### Query Performance
```sql
-- Efficient coordinate-based queries
SELECT * FROM companies 
WHERE hq_latitude BETWEEN 37.0 AND 38.0 
  AND hq_longitude BETWEEN -122.0 AND -121.0;
```

---

## Security Considerations

### API Key Management

#### Public Token Safety
- **Client-side Use**: Safe for browser exposure
- **Limited Scope**: Only geocoding permissions
- **No Billing Risk**: Read-only access

#### Environment Variables
```env
# Correct format (accessible in browser)
NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN=pk.your-token

# Incorrect format (server-side only)
MAPBOX_PUBLIC_TOKEN=pk.your-token  # Won't work!
```

### Data Privacy

#### Address Information
- **User Data**: Addresses sent to Mapbox API
- **Processing**: Temporary processing, not stored by Mapbox
- **Compliance**: GDPR/CCPA compliant processing

#### Coordinate Storage
- **Precision**: Coordinates stored with high precision
- **Access Control**: Protected by RLS policies
- **Audit Trail**: Changes tracked in database

---

## Testing & Validation

### Address Test Cases

#### Standard Addresses
```typescript
// Test successful normalization
const testAddress = "1401 21ST STE R SACRAMENTO, CA 95811";
const result = await normaliseWithMapbox(testAddress);
expect(result.relevance).toBeGreaterThan(0.9);
```

#### Edge Cases
```typescript
// Test international addresses
const intlAddress = "10 Downing Street, London SW1A 2AA, UK";
const result = await normaliseWithMapbox(intlAddress);
expect(result.country).toBe("GB");
```

### Fallback Testing

#### API Failure Simulation
```typescript
// Test regex fallback
const mockApiFailure = jest.fn().mockRejectedValue(new Error('API Error'));
const result = await parseAddressWithFallback(testAddress);
expect(result.method).toBe('regex');
```

---

## Troubleshooting

### Common Issues

#### "Mapbox token not found"
```
✗ Missing environment variable: NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN
```
**Solution**: Add token to `.env.local` and restart dev server

#### "Invalid token" error
```
✗ HTTP 401: Unauthorized
```
**Solution**: Verify token format starts with `pk.` and is active

#### "No geocoding results"
```
✗ Address could not be geocoded
```
**Solution**: Check address format and try more specific address

#### Low confidence scores
```
⚠ Relevance score: 0.3 (< 0.75 threshold)
```
**Solution**: Review parsed address for accuracy, manual correction may be needed

### Debug Commands

#### Test API Connection
```bash
# Test Mapbox API directly
curl "https://api.mapbox.com/geocoding/v5/mapbox.places/Sacramento.json?access_token=$NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN"
```

#### Check Environment
```bash
# Verify token is loaded
echo $NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN | cut -c1-10
# Should output: pk.ey...
```

#### Monitor API Usage
1. Visit [Mapbox Dashboard](https://account.mapbox.com/)
2. Navigate to Statistics → API Usage
3. Monitor request counts and rate limits

---

## Future Enhancements

### Planned Features

#### Geospatial Search
- **Proximity Queries**: Find companies near specific locations
- **Radius Filtering**: Filter by distance from coordinates
- **Map Visualization**: Display company locations on interactive map

#### Address Validation
- **Real-time Validation**: Validate addresses as user types
- **Suggestion API**: Provide address suggestions during input
- **Bulk Processing**: Batch geocode existing addresses

#### Enhanced Analytics
- **Geographic Insights**: Investment patterns by location
- **Clustering Analysis**: Identify investment hotspots
- **Distance Metrics**: Calculate distances between investments

### Technical Improvements

#### Performance Optimization
- **Request Caching**: Cache recent geocoding results
- **Batch Processing**: Use permanent endpoint for bulk operations
- **Async Processing**: Background geocoding for existing data

#### Error Handling
- **Retry Logic**: Intelligent retry for temporary failures
- **Circuit Breaker**: Prevent cascading failures
- **Fallback Chains**: Multiple fallback strategies

---

**Related Documentation:**
- [Environment Variables](reference/environment-variables.md) - API token configuration
- [Database Schema](reference/database-schema.md) - Coordinate field specifications
- [Migration History](reference/migration-history.md) - Schema change tracking
- [Form Validation](how-to/form-validation.md) - Address validation rules 