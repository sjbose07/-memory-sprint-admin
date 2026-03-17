import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // NextAdmin.co inspired color palette
        body: "#1a222c",         // Main background
        card: "#24303f",         // Card and sidebar background
        stroke: "#313d4a",       // Borders
        primary: "#3c50e0",      // Primary buttons and highlights
        secondary: "#80caee",
        success: "#219653",
        danger: "#d34053",
        warning: "#ffa70b",
        "body-text": "#8a99af", // Lighter text for descriptions
        "title-text": "#ffffff",  // Main white text for titles
      },
      fontFamily: {
        satoshi: ["Satoshi", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
