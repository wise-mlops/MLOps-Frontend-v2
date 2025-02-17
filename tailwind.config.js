const defaultTheme = require('tailwindcss/defaultTheme'); 

module.exports = {
  content: ['./node_modules/flowbite/**/*.js'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Google Sans','"Noto Sans KR"', ...defaultTheme.fontFamily.sans],
        'serif': ['"Noto Serif KR"', ...defaultTheme.fontFamily.serif],
        // 'custom': ['Open Sans', 'sans-serif'],
      },
    },
  },
  plugins: [require('flowbite/plugin')],
};