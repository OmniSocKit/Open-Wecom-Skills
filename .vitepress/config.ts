import { defineConfig } from 'vitepress'

/* ── Shared sidebar: Skills ── */
const skillsSidebarZh = [
  { text: 'Skills', items: [{ text: '总览', link: '/skills/' }] },
  { text: '基础域', collapsed: false, items: [
    { text: 'wecom-core — 认证基座', link: '/skills/enterprise/wecom-core' },
    { text: 'wecom-contact — 通讯录', link: '/skills/enterprise/wecom-contact' },
    { text: 'wecom-app — 应用管理', link: '/skills/enterprise/wecom-app' },
    { text: 'wecom-message — 消息', link: '/skills/enterprise/wecom-message' },
    { text: 'wecom-media — 素材', link: '/skills/enterprise/wecom-media' },
    { text: 'wecom-auth — 身份验证', link: '/skills/enterprise/wecom-auth' },
  ]},
  { text: 'CRM 域', collapsed: false, items: [
    { text: 'wecom-crm-customer — 客户管理', link: '/skills/enterprise/wecom-crm-customer' },
    { text: 'wecom-crm-tag — 客户标签', link: '/skills/enterprise/wecom-crm-tag' },
    { text: 'wecom-crm-masssend — 群发', link: '/skills/enterprise/wecom-crm-masssend' },
    { text: 'wecom-crm-contactway — 联系我', link: '/skills/enterprise/wecom-crm-contactway' },
    { text: 'wecom-crm-moment — 朋友圈', link: '/skills/enterprise/wecom-crm-moment' },
    { text: 'wecom-crm-group — 客户群', link: '/skills/enterprise/wecom-crm-group' },
    { text: 'wecom-crm-transfer — 继承', link: '/skills/enterprise/wecom-crm-transfer' },
    { text: 'wecom-crm-acquisition — 获客', link: '/skills/enterprise/wecom-crm-acquisition' },
  ]},
  { text: '办公域', collapsed: true, items: [
    { text: 'wecom-approval — 审批', link: '/skills/enterprise/wecom-approval' },
    { text: 'wecom-doc — 文档', link: '/skills/enterprise/wecom-doc' },
    { text: 'wecom-meeting — 会议', link: '/skills/enterprise/wecom-meeting' },
    { text: 'wecom-office-checkin — 打卡', link: '/skills/enterprise/wecom-office-checkin' },
    { text: 'wecom-office-calendar — 日程', link: '/skills/enterprise/wecom-office-calendar' },
    { text: 'wecom-office-email — 邮件', link: '/skills/enterprise/wecom-office-email' },
    { text: 'wecom-office-wedrive — 微盘', link: '/skills/enterprise/wecom-office-wedrive' },
    { text: 'wecom-office-live — 直播', link: '/skills/enterprise/wecom-office-live' },
  ]},
  { text: '客服域', collapsed: true, items: [
    { text: 'wecom-kf — 微信客服', link: '/skills/enterprise/wecom-kf' },
  ]},
  { text: '客户端域', collapsed: true, items: [
    { text: 'wecom-jssdk — JS-SDK', link: '/skills/enterprise/wecom-jssdk' },
    { text: 'wecom-miniapp — 小程序', link: '/skills/enterprise/wecom-miniapp' },
    { text: 'wecom-mobile-sdk — 移动端', link: '/skills/enterprise/wecom-mobile-sdk' },
  ]},
  { text: '高级域', collapsed: true, items: [
    { text: 'wecom-advanced — 高级功能', link: '/skills/enterprise/wecom-advanced' },
    { text: 'wecom-security — 安全管理', link: '/skills/enterprise/wecom-security' },
    { text: 'wecom-data-intelligence — 数据与智能', link: '/skills/enterprise/wecom-data-intelligence' },
  ]},
  { text: '行业域', collapsed: true, items: [
    { text: 'wecom-vertical — 行业应用', link: '/skills/enterprise/wecom-vertical' },
  ]},
  { text: 'ISV 服务商代开发', collapsed: false, items: [
    { text: 'wecom-isv-core — 凭证基座', link: '/skills/isv/wecom-isv-core' },
    { text: 'wecom-isv-auth — 授权流程', link: '/skills/isv/wecom-isv-auth' },
    { text: 'wecom-isv-callback — 回调体系', link: '/skills/isv/wecom-isv-callback' },
    { text: 'wecom-isv-license — 接口许可', link: '/skills/isv/wecom-isv-license' },
    { text: 'wecom-isv-billing — 收银台', link: '/skills/isv/wecom-isv-billing' },
    { text: 'wecom-isv-jssdk — JS-SDK 差异', link: '/skills/isv/wecom-isv-jssdk' },
    { text: 'wecom-isv-provider — 服务商管理', link: '/skills/isv/wecom-isv-provider' },
    { text: 'wecom-isv-appendix — 附录', link: '/skills/isv/wecom-isv-appendix' },
  ]},
  { text: '第三方应用开发', collapsed: false, items: [
    { text: 'wecom-3rd-quickstart — 快速入门', link: '/skills/third-party/wecom-3rd-quickstart' },
    { text: 'wecom-3rd-idconvert — ID 转换', link: '/skills/third-party/wecom-3rd-idconvert' },
    { text: 'wecom-3rd-data — 数据 API', link: '/skills/third-party/wecom-3rd-data' },
  ]},
]

/* English sidebar mirrors structure but with /en/ prefix */
function prefixLinks(sidebar: any[], prefix: string): any[] {
  return sidebar.map(section => ({
    ...section,
    items: section.items.map((item: any) => ({
      ...item,
      link: item.link ? prefix + item.link : item.link,
    })),
  }))
}

const skillsSidebarEn = prefixLinks(skillsSidebarZh, '/en')

export default defineConfig({
  /* ── Site Meta ── */
  base: '/',
  title: 'Open WeCom Skills',
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
    ['link', { rel: 'apple-touch-icon', href: '/logo.png' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap' }],
    // 百度统计
    ['script', {}, `var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?f99234032d5ecb87b0a78b41f594b7ae";
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(hm, s);
})();`],
  ],

  /* ── Source & Build ── */
  srcDir: '.',
  srcExclude: [
    'README.md',
    'README.en.md',
    'MEMORY.md',
    'CHANGELOG.md',
    'CONTRIBUTING.md',
    'CONTRIBUTING.en.md',
    'CODE_OF_CONDUCT.md',
    'updatelog.md',
    'node_modules/**',
    '.github/**',
    'docs/testing/**',
    'docs/guides/quickstart.md',
    'skills/README.md',
  ],
  ignoreDeadLinks: true,

  /* ── i18n Locales ── */
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      description: '让你的 AI 大模型成为企业微信开发专家 — 41 Skills · 550+ APIs · MCP 一行命令接入',
      themeConfig: {
        nav: [
          { text: '首页', link: '/' },
          {
            text: '快速开始',
            items: [
              { text: 'MCP 接入（推荐）', link: '/docs/guides/mcp-setup' },
              { text: '手动配置', link: '/docs/guides/ai-setup' },
            ],
          },
          { text: '参考案例', link: '/docs/showcase/skill-demo-response' },
          {
            text: 'Skills',
            items: [
              { text: '总览', link: '/skills/' },
              { text: '企业内部开发', link: '/skills/enterprise/wecom-core' },
              { text: '服务商代开发 (ISV)', link: '/skills/isv/wecom-isv-core' },
              { text: '第三方应用', link: '/skills/third-party/wecom-3rd-quickstart' },
            ],
          },
          { text: '源雀 SCRM', link: 'https://www.iyque.cn/' },
        ],
        sidebar: {
          '/docs/': [
            { text: '指南', items: [
              { text: 'MCP 接入指南（推荐）', link: '/docs/guides/mcp-setup' },
              { text: '手动配置', link: '/docs/guides/ai-setup' },
              { text: 'SKILL 架构规范', link: '/docs/guides/architecture' },
            ]},
            { text: '参考', items: [
              { text: 'API 模块索引', link: '/docs/references/api-index' },
              { text: '全局错误码', link: '/docs/references/error-codes' },
              { text: '企业规模与行业信息', link: '/docs/references/industry-codes' },
            ]},
            { text: '展示', items: [
              { text: '实战对比示例', link: '/docs/showcase/skill-demo-response' },
            ]},
          ],
          '/skills/': skillsSidebarZh,
        },
        editLink: {
          pattern: 'https://github.com/OmniSocKit/Open-Wecom-Skills/edit/main/:path',
          text: '在 GitHub 上编辑此页',
        },
        outline: { level: [2, 3], label: '页面导航' },
        lastUpdated: { text: '最后更新于' },
        search: {
          provider: 'local',
          options: {
            translations: {
              button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
              modal: {
                noResultsText: '没有找到结果',
                resetButtonTitle: '清除搜索',
                footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
              },
            },
          },
        },
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      description: 'Make your AI model a WeCom development expert — 41 Skills · 550+ APIs · One-line MCP setup',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          {
            text: 'Quick Start',
            items: [
              { text: 'MCP Setup (Recommended)', link: '/en/docs/guides/mcp-setup' },
              { text: 'Manual Setup', link: '/en/docs/guides/ai-setup' },
            ],
          },
          { text: 'Showcase', link: '/en/docs/showcase/skill-demo-response' },
          {
            text: 'Skills',
            items: [
              { text: 'Overview', link: '/en/skills/' },
              { text: 'Enterprise', link: '/en/skills/enterprise/wecom-core' },
              { text: 'ISV', link: '/en/skills/isv/wecom-isv-core' },
              { text: 'Third-Party Apps', link: '/en/skills/third-party/wecom-3rd-quickstart' },
            ],
          },
          { text: 'YuanQue SCRM', link: 'https://www.iyque.cn/' },
        ],
        sidebar: {
          '/en/docs/': [
            { text: 'Guides', items: [
              { text: 'MCP Setup (Recommended)', link: '/en/docs/guides/mcp-setup' },
              { text: 'Manual Setup', link: '/en/docs/guides/ai-setup' },
              { text: 'SKILL Architecture', link: '/en/docs/guides/architecture' },
            ]},
            { text: 'References', items: [
              { text: 'API Module Index', link: '/en/docs/references/api-index' },
              { text: 'Global Error Codes', link: '/en/docs/references/error-codes' },
              { text: 'Industry Codes', link: '/en/docs/references/industry-codes' },
            ]},
            { text: 'Showcase', items: [
              { text: 'Live Demo Comparison', link: '/en/docs/showcase/skill-demo-response' },
            ]},
          ],
          '/en/skills/': skillsSidebarEn,
        },
        editLink: {
          pattern: 'https://github.com/OmniSocKit/Open-Wecom-Skills/edit/main/:path',
          text: 'Edit this page on GitHub',
        },
        outline: { level: [2, 3], label: 'On this page' },
        lastUpdated: { text: 'Last updated' },
      },
    },
  },

  /* ── Theme (shared) ── */
  themeConfig: {
    logo: '/logo.png',
    siteTitle: 'Open WeCom Skills',

    socialLinks: [
      { icon: 'github', link: 'https://github.com/OmniSocKit/Open-Wecom-Skills' },
      {
        icon: { svg: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.15a.59.59 0 0 1-.592-.592v-1.482a.593.593 0 0 1 .593-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296Z"/></svg>' },
        link: 'https://gitee.com/omni-soc-kit/open-wecom-skills',
        ariaLabel: 'Gitee',
      },
      {
        icon: { svg: '<svg viewBox="0 0 1024 1024"><path fill="currentColor" d="M660.48 212.352c5.952-3.392 12.352-6.912 19.2-10.88l2.368 12.032c1.28 6.272 2.368 11.456 2.88 16.512 4.032 44.288 26.304 76.928 57.856 84.224 46.144 10.752 89.664-7.04 113.088-46.08 28.16-46.848 16-104.32-32-138.88C690.56 33.216 544.128 6.72 386.304 53.056 46.144 153.344-70.272 571.264 171.2 827.52c103.296 109.632 234.432 156.928 383.36 153.344 190.72-4.48 328-99.52 415.744-264.256 62.08-116.864-5.44-244.608-134.848-271.168a837.376 837.376 0 0 0-224.768-14.4c-24.96 2.432-49.28 9.792-71.424 21.76-24.768 12.8-31.872 39.488-29.12 65.92 2.56 24.064 21.056 38.528 43.008 42.176 44.288 6.912 89.088 10.88 133.76 14.592 12.928 1.088 25.984 1.28 39.04 1.344 18.752 0.192 37.376 0.384 55.68 3.392 52.032 8.576 69.888 50.816 43.136 96-6.592 10.88-14.208 21.056-22.848 30.336a259.392 259.392 0 0 1-131.392 77.76c-92.416 22.592-184.896 23.872-276.8-5.12-104.704-33.088-167.168-109.952-169.344-213.504-0.832-63.872 15.36-126.72 46.976-182.272 14.272-25.856 22.08-52.48 19.84-81.856-0.896-12.48-1.408-24.96-1.92-38.4l-1.024-22.4c10.624 2.176 21.12 4.992 31.36 8.32 40.064 16.128 79.488 23.488 122.88 11.648A222.08 222.08 0 0 1 517.76 256a188.608 188.608 0 0 0 115.648-28.288c8.64-5.056 17.344-9.92 26.944-15.36z"/></svg>' },
        link: 'https://gitcode.com/omnisockit/OpenWecomSkills',
        ariaLabel: 'GitCode',
      },
    ],

    footer: {
      message: 'Released under the Apache 2.0 License.',
      copyright: '© 2026 Open WeCom Skills Contributors',
    },

    search: {
      provider: 'local',
    },
  },
})
