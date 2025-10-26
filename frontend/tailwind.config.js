/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Mobile-first spacing for touch targets (44x44px minimum)
      spacing: {
        'touch': '44px',
        'touch-sm': '36px',
      },
      // Safe area insets for mobile devices
      padding: {
        'safe': 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
        'safe-t': 'env(safe-area-inset-top)',
        'safe-r': 'env(safe-area-inset-right)',
        'safe-b': 'env(safe-area-inset-bottom)',
        'safe-l': 'env(safe-area-inset-left)',
      },
      // Mobile-optimized screen breakpoints (using Tailwind defaults but documenting them)
      screens: {
        // 'sm': '640px',  // Small devices (landscape phones)
        // 'md': '768px',  // Medium devices (tablets)
        // 'lg': '1024px', // Large devices (desktops)
        // 'xl': '1280px', // Extra large devices
        // 'mobile-only': {'max': '767px'}, // Uncomment if needed for mobile-only styles
      },
      // Touch-friendly minimum sizes
      minWidth: {
        'touch': '44px',
      },
      minHeight: {
        'touch': '44px',
      },
    },
  },
  plugins: [],
}
