/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0B0F1F",
          900: "#111730",
          800: "#171F3D",
          700: "#212B52",
          600: "#2C3866",
        },
        signal: {
          400: "#8B93FF",
          500: "#6E76F5",
          600: "#5A5FE0",
        },
        ember: {
          400: "#FF9B6A",
          500: "#FF7F4D",
        },
        mist: {
          100: "#F4F5FB",
          300: "#C3C8E4",
          500: "#8992BD",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        constellation:
          "radial-gradient(circle at 15% 20%, rgba(110,118,245,0.18), transparent 35%), radial-gradient(circle at 85% 0%, rgba(255,127,77,0.12), transparent 40%)",
      },
    },
  },
  plugins: [],
};
