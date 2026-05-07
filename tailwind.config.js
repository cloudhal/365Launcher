module.exports = {
  content: ["./popup.html", "./popup.js"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        panel: "0 18px 45px rgba(15, 23, 42, 0.18)",
      },
      colors: {
        slate: {
          950: "#020617",
        },
      },
    },
  },
  darkMode: "class",
};