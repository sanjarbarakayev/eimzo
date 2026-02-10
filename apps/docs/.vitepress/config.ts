import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'E-IMZO SDK',
  description: 'TypeScript SDK for E-IMZO electronic digital signatures',
  ignoreDeadLinks: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/getting-started/installation' },
      { text: 'API Reference', link: '/api/' },
      { text: 'Examples', link: '/examples/basic-signing' },
      {
        text: 'Links',
        items: [
          { text: 'GitHub', link: 'https://github.com/sanjarbarakayev/eimzo' },
          { text: 'npm', link: 'https://www.npmjs.com/package/@eimzo/core' },
          { text: 'Playground', link: '/playground' },
        ],
      },
    ],

    sidebar: {
      '/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Installation', link: '/getting-started/installation' },
            { text: 'Quick Start', link: '/getting-started/quick-start' },
            { text: 'Configuration', link: '/getting-started/configuration' },
          ],
        },
        {
          text: 'Guide',
          items: [
            { text: 'Core Concepts', link: '/guide/core-concepts' },
            { text: 'Certificates', link: '/guide/certificates' },
            { text: 'Signing Documents', link: '/guide/signing' },
            { text: 'Error Handling', link: '/guide/error-handling' },
            { text: 'Internationalization', link: '/guide/i18n' },
          ],
        },
        {
          text: 'Framework Guides',
          items: [
            { text: 'Vue.js', link: '/frameworks/vue' },
            { text: 'Nuxt', link: '/frameworks/nuxt' },
            { text: 'Vanilla JS', link: '/frameworks/vanilla' },
          ],
        },
        {
          text: 'Examples',
          items: [
            { text: 'Basic Signing', link: '/examples/basic-signing' },
            { text: 'Certificate Selection', link: '/examples/certificate-selection' },
            { text: 'Error Handling', link: '/examples/error-handling' },
          ],
        },
        {
          text: 'API Reference',
          link: '/api/',
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/sanjarbarakayev/eimzo' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright 2024 Sanjar Barakayev',
    },

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/sanjarbarakayev/eimzo/edit/main/apps/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
})
