module.exports = {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        primary: "#0d6efd",
        secondary: "#6c757d",
        success: "#198754",
        danger: "#dc3545",
        warning: "#ffc107",
        info: "#0dcaf0",
        light: "#f8f9fa",
        dark: "#212529",
      },
      animation: {
        pulse: "pulse 1.5s infinite",
        fadeInUp: "fadeInUp 0.4s ease-out forwards",
      },
      keyframes: {
        pulse: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
