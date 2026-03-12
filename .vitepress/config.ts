import { defineConfig } from 'vitepress'

export default defineConfig({
  /* ── Site Meta ── */
  base: '/Open-Wecom-Skills/',
  lang: 'zh-CN',
  title: 'Open WeCom Skills',
  description: '让你的 AI 大模型成为企业微信开发专家 — 41 Skills · 550+ APIs · 三大开发模式全覆盖',
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
    ['link', { rel: 'apple-touch-icon', href: '/logo.png' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap' }],
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

  /* ── Theme ── */
  themeConfig: {
    logo: '/logo.png',
    siteTitle: 'Open WeCom Skills',

    /* ── Top Nav ── */
    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/docs/guides/ai-setup' },
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
    ],

    /* ── Sidebar ── */
    sidebar: {
      '/docs/': [
        {
          text: '指南',
          items: [
            { text: '快速开始', link: '/docs/guides/ai-setup' },
            { text: 'SKILL 架构规范', link: '/docs/guides/architecture' },
          ],
        },
        {
          text: '参考',
          items: [
            { text: 'API 模块索引', link: '/docs/references/api-index' },
            { text: '全局错误码', link: '/docs/references/error-codes' },
            { text: '企业规模与行业信息', link: '/docs/references/industry-codes' },
          ],
        },
        {
          text: '展示',
          items: [
            { text: '实战对比示例', link: '/docs/showcase/skill-demo-response' },
          ],
        },
      ],

      '/skills/': [
        {
          text: 'Skills',
          items: [
            { text: '总览', link: '/skills/' },
          ],
        },
        {
          text: '基础域',
          collapsed: false,
          items: [
            { text: 'wecom-core — 认证基座', link: '/skills/enterprise/wecom-core' },
            { text: 'wecom-contact — 通讯录', link: '/skills/enterprise/wecom-contact' },
            { text: 'wecom-app — 应用管理', link: '/skills/enterprise/wecom-app' },
            { text: 'wecom-message — 消息', link: '/skills/enterprise/wecom-message' },
            { text: 'wecom-media — 素材', link: '/skills/enterprise/wecom-media' },
            { text: 'wecom-auth — 身份验证', link: '/skills/enterprise/wecom-auth' },
          ],
        },
        {
          text: 'CRM 域',
          collapsed: false,
          items: [
            { text: 'wecom-crm-customer — 客户管理', link: '/skills/enterprise/wecom-crm-customer' },
            { text: 'wecom-crm-tag — 客户标签', link: '/skills/enterprise/wecom-crm-tag' },
            { text: 'wecom-crm-masssend — 群发', link: '/skills/enterprise/wecom-crm-masssend' },
            { text: 'wecom-crm-contactway — 联系我', link: '/skills/enterprise/wecom-crm-contactway' },
            { text: 'wecom-crm-moment — 朋友圈', link: '/skills/enterprise/wecom-crm-moment' },
            { text: 'wecom-crm-group — 客户群', link: '/skills/enterprise/wecom-crm-group' },
            { text: 'wecom-crm-transfer — 继承', link: '/skills/enterprise/wecom-crm-transfer' },
            { text: 'wecom-crm-acquisition — 获客', link: '/skills/enterprise/wecom-crm-acquisition' },
          ],
        },
        {
          text: '办公域',
          collapsed: true,
          items: [
            { text: 'wecom-approval — 审批', link: '/skills/enterprise/wecom-approval' },
            { text: 'wecom-doc — 文档', link: '/skills/enterprise/wecom-doc' },
            { text: 'wecom-meeting — 会议', link: '/skills/enterprise/wecom-meeting' },
            { text: 'wecom-office-checkin — 打卡', link: '/skills/enterprise/wecom-office-checkin' },
            { text: 'wecom-office-calendar — 日程', link: '/skills/enterprise/wecom-office-calendar' },
            { text: 'wecom-office-email — 邮件', link: '/skills/enterprise/wecom-office-email' },
            { text: 'wecom-office-wedrive — 微盘', link: '/skills/enterprise/wecom-office-wedrive' },
            { text: 'wecom-office-live — 直播', link: '/skills/enterprise/wecom-office-live' },
          ],
        },
        {
          text: '客服域',
          collapsed: true,
          items: [
            { text: 'wecom-kf — 微信客服', link: '/skills/enterprise/wecom-kf' },
          ],
        },
        {
          text: '客户端域',
          collapsed: true,
          items: [
            { text: 'wecom-jssdk — JS-SDK', link: '/skills/enterprise/wecom-jssdk' },
            { text: 'wecom-miniapp — 小程序', link: '/skills/enterprise/wecom-miniapp' },
            { text: 'wecom-mobile-sdk — 移动端', link: '/skills/enterprise/wecom-mobile-sdk' },
          ],
        },
        {
          text: '高级域',
          collapsed: true,
          items: [
            { text: 'wecom-advanced — 高级功能', link: '/skills/enterprise/wecom-advanced' },
            { text: 'wecom-security — 安全管理', link: '/skills/enterprise/wecom-security' },
            { text: 'wecom-data-intelligence — 数据与智能', link: '/skills/enterprise/wecom-data-intelligence' },
          ],
        },
        {
          text: '行业域',
          collapsed: true,
          items: [
            { text: 'wecom-vertical — 行业应用', link: '/skills/enterprise/wecom-vertical' },
          ],
        },
        {
          text: 'ISV 服务商代开发',
          collapsed: false,
          items: [
            { text: 'wecom-isv-core — 凭证基座', link: '/skills/isv/wecom-isv-core' },
            { text: 'wecom-isv-auth — 授权流程', link: '/skills/isv/wecom-isv-auth' },
            { text: 'wecom-isv-callback — 回调体系', link: '/skills/isv/wecom-isv-callback' },
            { text: 'wecom-isv-license — 接口许可', link: '/skills/isv/wecom-isv-license' },
            { text: 'wecom-isv-billing — 收银台', link: '/skills/isv/wecom-isv-billing' },
            { text: 'wecom-isv-jssdk — JS-SDK 差异', link: '/skills/isv/wecom-isv-jssdk' },
            { text: 'wecom-isv-provider — 服务商管理', link: '/skills/isv/wecom-isv-provider' },
            { text: 'wecom-isv-appendix — 附录', link: '/skills/isv/wecom-isv-appendix' },
          ],
        },
        {
          text: '第三方应用开发',
          collapsed: false,
          items: [
            { text: 'wecom-3rd-quickstart — 快速入门', link: '/skills/third-party/wecom-3rd-quickstart' },
            { text: 'wecom-3rd-idconvert — ID 转换', link: '/skills/third-party/wecom-3rd-idconvert' },
            { text: 'wecom-3rd-data — 数据 API', link: '/skills/third-party/wecom-3rd-data' },
          ],
        },
      ],
    },

    /* ── Search ── */
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

    /* ── Social Links ── */
    socialLinks: [
      { icon: 'github', link: 'https://github.com/iuraixmi/Open-Wecom-Skills' },
    ],

    /* ── Footer ── */
    footer: {
      message: 'Released under the Apache 2.0 License.',
      copyright: '© 2026 Open WeCom Skills Contributors',
    },

    editLink: {
      pattern: 'https://github.com/iuraixmi/Open-Wecom-Skills/edit/main/:path',
      text: '在 GitHub 上编辑此页',
    },

    outline: {
      level: [2, 3],
      label: '页面导航',
    },

    lastUpdated: {
      text: '最后更新于',
    },
  },
})
