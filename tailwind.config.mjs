/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        honda: {
          red: '#CC0000',
          dark: '#1A1A1A',
          gray: '#2D2D2D',
        },
        primary: '#CC0000',
        accent: '#FF1A1A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-links': theme('colors.primary'),
            '--tw-prose-headings': theme('colors.gray.900'),
            'a': {
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
            'h1, h2, h3, h4': {
              fontFamily: theme('fontFamily.heading').join(', '),
              fontWeight: '700',
            },
          },
        },
        invert: {
          css: {
            '--tw-prose-headings': theme('colors.white'),
            '--tw-prose-body': theme('colors.gray.300'),
            '--tw-prose-bold': theme('colors.white'),
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
