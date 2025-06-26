# iOS Safari Scrolling Issue Fix

## Problem Identified

The Pitch Fund homepage was experiencing glitchy, skipping scroll behavior on Safari iOS when scrolling down from the hero section. This is a common issue with full-screen hero sections on mobile Safari.

## Root Causes

1. **`100dvh` viewport unit**: The hero section was using `min-h-[100dvh]` which causes scrolling glitches on iOS Safari because this unit dynamically changes as the browser's toolbar shows/hides during scroll.

2. **`scroll-behavior: smooth`**: This CSS property can conflict with iOS Safari's native momentum scrolling, causing jerky behavior.

3. **Missing touch scrolling optimization**: iOS Safari requires specific webkit properties for optimal touch scrolling.

## Fixes Implemented

### 1. Hero Section Height Fix (`src/app/page.tsx`)
- **Before**: `min-h-[100dvh]`
- **After**: Added custom CSS class `hero-section` with proper fallbacks

### 2. Global CSS Improvements (`src/app/globals.css`)

#### iOS Safari Scroll Behavior Fix
```css
/* iOS Safari smooth scrolling fix */
@supports (-webkit-touch-callout: none) {
  html {
    scroll-behavior: auto;
  }
  
  body {
    -webkit-overflow-scrolling: touch;
  }
}
```

#### Robust Viewport Height Solution
```css
/* iOS Safari viewport height fix for hero sections */
.hero-section {
  min-height: 100vh; /* Fallback for older browsers */
  min-height: 100svh; /* Small viewport height - more stable on iOS */
}

/* Additional fallback for iOS Safari */
@supports (-webkit-touch-callout: none) {
  .hero-section {
    min-height: -webkit-fill-available;
  }
}
```

## Technical Details

- **`100svh`**: Uses "small viewport height" which remains constant regardless of toolbar state, providing smoother scrolling
- **`-webkit-fill-available`**: iOS Safari specific fallback that properly fills the available space
- **`-webkit-overflow-scrolling: touch`**: Enables hardware-accelerated momentum scrolling on iOS
- **Browser detection**: Uses `@supports (-webkit-touch-callout: none)` to target only iOS Safari

## Expected Results

- ✅ Smooth scrolling from hero section on iOS Safari
- ✅ No more glitchy/skipping behavior when scrolling down
- ✅ Proper viewport height handling across all iOS Safari versions
- ✅ Maintained functionality on other browsers

## Testing Recommendations

1. Test on various iOS devices (iPhone, iPad)
2. Test in both Safari browser and in-app browsers
3. Test with different screen orientations
4. Verify scrolling behavior with and without Safari's address bar visible