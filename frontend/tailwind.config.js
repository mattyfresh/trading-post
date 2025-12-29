/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // MTG-inspired color palette
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        // Binder colors
        binder: {
          page: "#f5f0e6",
          sleeve: "rgba(255, 255, 255, 0.3)",
          border: "#d4c4a8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      aspectRatio: {
        card: "63 / 88", // Standard MTG card ratio
      },
      gridTemplateColumns: {
        binder: "repeat(3, minmax(0, 1fr))",
      },
    },
  },
  plugins: [],
};
