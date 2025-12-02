import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-aqua': '#005478',   // Primary brand color
        'brand-black': '#231F20', // Text/strong elements
        'brand-blue': '#58595b',  // Secondary gray-blue
      },
      fontFamily: {
        sans: ['Myriad Pro', 'sans-serif'],
        // You'll need to load Myriad Pro (see Step 3)
      },
    },
  },
  plugins: [],
};

export default config;