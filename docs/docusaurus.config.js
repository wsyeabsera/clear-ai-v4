// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer').themes.github;
const darkCodeTheme = require('prism-react-renderer').themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Clear AI V4',
  tagline: 'Multi-Package GraphQL Backend with LLM-Powered Tool Chaining',
  url: 'https://yab.github.io',
  baseUrl: '/clear-ai-v4/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',

  // GitHub pages deployment config
  organizationName: 'yab',
  projectName: 'clear-ai-v4',

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/yab/clear-ai-v4/tree/main/',
          path: './docs',
        },
        pages: false,
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Clear AI V4',
        logo: {
          alt: 'Clear AI Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'doc',
            docId: 'intro',
            position: 'left',
            label: 'Documentation',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/yab/clear-ai-v4',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Getting Started',
                to: '/intro',
              },
              {
                label: 'Architecture',
                to: '/getting-started/architecture-overview',
              },
              {
                label: 'API Reference',
                to: '/api-reference/planner-agent',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/yab/clear-ai-v4',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Clear AI. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ['bash', 'json', 'graphql'],
      },
    }),
};

module.exports = config;

