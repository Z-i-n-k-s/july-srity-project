/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#080A11",
          900: "#0F121C",
          850: "#131620",
          800: "#171925",
          700: "#1D1D29",
        },
        archive: {
          amber: "#D79A54",
          copper: "#B96F45",
          rose: "#B96776",
          teal: "#4B9B8D",
          paper: "#F4F1EA",
          muted: "#8D929F",
        },
      },
      fontFamily: {
        display: ["Georgia", "Noto Serif Bengali", "serif"],
        bangla: ["Noto Sans Bengali", "Hind Siliguri", "sans-serif"],
      },
      boxShadow: {
        archive: "0 24px 70px rgba(0,0,0,.38)",
        amber: "0 10px 30px rgba(215,154,84,.18)",
        warm: "0 18px 50px rgba(215,154,84,.12)",
        rose: "0 18px 50px rgba(185,103,118,.12)",
      },
      opacity: {
        12: ".12",
        13: ".13",
        14: ".14",
        15: ".15",
        35: ".35",
        45: ".45",
      },
    },
  },
  plugins: [],
};
