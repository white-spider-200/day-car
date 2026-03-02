import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          50: "#eaf7f6",
          100: "#d5efee",
          200: "#abdfdc",
          300: "#7ecdc8",
          400: "#53b8b1",
          500: "#2fa39b",
          600: "#22827d",
          700: "#1a6561",
          800: "#154f4d",
          900: "#113f3d"
        }
      }
    }
  },
  plugins: []
};

export default config;
