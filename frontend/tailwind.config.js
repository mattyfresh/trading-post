/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // NES-inspired retro palette
        primary: {
          50: "#f5faff",
          100: "#eaf3ff",
          200: "#d2e6ff",
          300: "#a8cbff",
          400: "#6fa8ff",
          500: "#2f7bff",
          600: "#0058f8", // NES blue — main buttons/logo/links
          700: "#0041c4",
          800: "#002e90",
          900: "#001c5c",
        },
        // Binder colors
        binder: {
          page: "#f5f0e6",
          sleeve: "rgba(255, 255, 255, 0.3)",
          border: "#d4c4a8",
        },
        ink: "#1b1b1b", // near-black: borders, hard shadows, primary text
        cream: "#f5f0e6", // page background
        danger: {
          DEFAULT: "#f83800",
          100: "#ffe1d6",
          600: "#f83800",
          700: "#c22600",
        },
        success: {
          DEFAULT: "#00a800",
          100: "#dff7da",
          600: "#00a800",
          700: "#007800",
        },
        gold: {
          DEFAULT: "#f8b800",
          100: "#fff3cf",
          600: "#f8b800",
          700: "#c68f00",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ['"Press Start 2P"', "system-ui", "monospace"],
      },
      // Retro reskin zeroes corner radius app-wide (rounded-full is left
      // alone on purpose so avatars/dots stay circular) — every existing
      // rounded-* class already in the app becomes square automatically.
      borderRadius: {
        none: "0px",
        sm: "0px",
        DEFAULT: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        "3xl": "0px",
      },
      boxShadow: {
        "pixel-sm": "2px 2px 0 0 #1b1b1b",
        pixel: "4px 4px 0 0 #1b1b1b",
        "pixel-lg": "6px 6px 0 0 #1b1b1b",
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
