/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#0d91a5",
                "background-light": "#f8fafa",
                "background-dark": "#1a1a1a",
                "rakuten-red": "#bf0000",
                "chatwork-blue": "#005BAC",
                "sidebar-dark": "#1e293b",
            },
            fontFamily: {
                "display": ["Space Grotesk", "Noto Sans JP", "sans-serif"],
                "manrope": ["Manrope", "sans-serif"],
                "inter": ["Inter", "sans-serif"],
                "public": ["Public Sans", "sans-serif"],
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "full": "9999px",
            },
        },
    },
    plugins: [],
}
