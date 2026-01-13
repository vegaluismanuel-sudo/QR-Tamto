/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'tamto-yellow': '#FBCC00',
                'tamto-grey': '#454547',
                'tamto-black': '#060405',
            },
            fontFamily: {
                sans: ['"Segoe UI"', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
