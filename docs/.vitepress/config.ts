import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Sigyn",
  description: "Grafana Loki Alerting Agent",
  themeConfig: {
    nav: [
      { text: 'Documentation', link: '/agent/installation', activeMatch: '^/documentation/' },
      {
        text: "Notifiers",
        items: [
          { text: 'Notifiers', link: '/notifiers/README', activeMatch: '^/notifiers/' },
          { text: 'Discord', link: '/discord/README', activeMatch: '^/discord/' },
          { text: 'Slack', link: '/slack/README', activeMatch: '^/slack/' },
          { text: 'Teams', link: '/teams/README', activeMatch: '^/teams/' },
        ]
      }
    ],
    search: {
      provider: 'local',
    },
    sidebar: [
      {
        items: [
          {
            text: "Agent",
            items: [
              {
                text: "Installation",
                link: "/agent/installation"
              },
              {
                text: "Getting Started",
                link: "/agent/getting-started"
              }
            ]
          },
          {
            text: "Config",
            items: [
              {
                text: "Overview",
                link: "/config/",
              },
              {
                text: "Rules",
                link: "/config/rules"
              },
              {
                text: "Templates",
                link: "/config/templates"
              },
              {
                text: "Composite Rules",
                link: "/config/composite-rules"
              },
              {
                text: "Self Monitoring",
                link: "/config/self-monitoring"
              },
              {
                text: "Throttle",
                link: "/config/throttle"
              },
            ]
          }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/MyUnisoft/sigyn/' }
    ]
  },
  base: "/sigyn/",
  rewrites: {
    ":pkg/docs/(.*)": ":pkg/(.*)"
  },
  srcDir: '../src',
  // there is a false positive dead link in /logql/ParserExpression
  ignoreDeadLinks: true
})
