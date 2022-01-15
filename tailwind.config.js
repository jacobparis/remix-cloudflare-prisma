module.exports = {
  content: ["./app/**/**.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: "Manrope, sans-serif",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
}
