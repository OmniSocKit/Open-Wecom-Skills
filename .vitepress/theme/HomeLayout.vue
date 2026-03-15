<script setup>
import { ref, onMounted } from 'vue'
import {
  Zap, Target, Shield, Code2, Building2, Link2, Package,
  Crosshair, Rocket, ArrowRight, BookOpen,
  Terminal, GitBranch, Globe, CheckCircle2, XCircle, Sparkles,
  Layers, Users, Briefcase, Headphones, Smartphone, Database, Factory,
  ChevronRight, ExternalLink, Cpu, Copy
} from 'lucide-vue-next'

const visible = ref(false)
const countUp = ref(false)
const typedText = ref('')
const showCursor = ref(true)
const typingDone = ref(false)

onMounted(() => {
  visible.value = true
  setTimeout(() => { countUp.value = true }, 300)

  // 打字机效果
  const fullText = 'Open WeCom Skills'
  let i = 0
  const typeInterval = setInterval(() => {
    typedText.value = fullText.slice(0, i + 1)
    i++
    if (i >= fullText.length) {
      clearInterval(typeInterval)
      typingDone.value = true
    }
  }, 80)
})

const stats = [
  { value: '41', label: 'Skills', icon: Layers },
  { value: '550+', label: 'APIs', icon: Code2 },
  { value: '75+', label: '回调', icon: GitBranch },
  { value: 'MCP', label: '一行接入', icon: Cpu },
  { value: '5', label: '语言模板', icon: Terminal },
]

const modes = [
  { icon: Building2, title: '企业内部开发', count: 30, color: '#3b82f6', desc: '自建应用直接对接，覆盖基础、CRM、办公等 7 大域', link: '/skills/enterprise/wecom-core' },
  { icon: Link2, title: '服务商代开发', count: 8, color: '#8b5cf6', desc: '三级凭证体系 + 双通道回调 + 接口许可管理', link: '/skills/isv/wecom-isv-core' },
  { icon: Package, title: '第三方应用', count: 3, color: '#f59e0b', desc: '应用市场分发 · ID 加密互转 · 数据 API 专区', link: '/skills/third-party/wecom-3rd-quickstart' },
]

const values = [
  { icon: Crosshair, title: '精确 API 知识', desc: '每个接口精确到 endpoint、参数类型、响应结构和限制条件', bullets: ['Endpoint 级精确', 'doc_id 可溯源', '参数类型完备'], color: '#14b8a6' },
  { icon: Shield, title: '踩坑指南', desc: '真实开发陷阱、字段歧义、时效限制的结构化文档', bullets: ['WelcomeCode 20s 限制', 'remark_mobiles 覆盖式', 'linkedcorp 全 POST'], color: '#f59e0b' },
  { icon: Rocket, title: '即用代码模板', desc: 'Python / TypeScript / Go / Java / PHP 五语言代码模板', bullets: ['五语言统一规范', '自动分页处理', '错误码映射'], color: '#8b5cf6' },
]

const howSteps = [
  { num: '01', title: '添加 MCP 配置', desc: '在 AI 工具中添加一行 JSON 配置', icon: Terminal },
  { num: '02', title: 'AI 自动发现', desc: 'AI 自动发现 41 个企微 SKILL 可读取', icon: Sparkles },
  { num: '03', title: '提出需求', desc: '像平常一样对 AI 说话，AI 按需读取 SKILL', icon: GitBranch },
  { num: '04', title: '精确输出', desc: '基于精确知识生成代码，自动避坑', icon: CheckCircle2 },
]

const compare = [
  { dim: 'API 路径', bad: '可能编造不存在的 endpoint', good: '精确到 /externalcontact/resigned/transfer_customer' },
  { dim: '字段歧义', bad: '不知道 follow_user 和 follow_info 差异', good: '主动标注为 CRITICAL 级陷阱' },
  { dim: '在职/离职继承', bad: '概念混淆', good: '给出 6 维对比表' },
  { dim: '会话存档', bad: '可能编造 HTTP API', good: '明确告知需要 C/C++ SDK' },
  { dim: '错误处理', bad: 'errcode=0 以为全部成功', good: '提醒逐个检查 customer[].errcode' },
]

const domains = [
  { icon: Zap, label: '基础', count: 6, color: '#3b82f6' },
  { icon: Users, label: 'CRM', count: 8, color: '#07C160' },
  { icon: Briefcase, label: '办公', count: 8, color: '#f97316' },
  { icon: Headphones, label: '客服', count: 1, color: '#a855f7' },
  { icon: Smartphone, label: '客户端', count: 3, color: '#eab308' },
  { icon: Database, label: '高级', count: 3, color: '#94a3b8' },
  { icon: Factory, label: '行业', count: 1, color: '#ef4444' },
]

const aiTools = [
  { name: 'Claude Desktop', icon: Terminal },
  { name: 'Claude Code', icon: Code2 },
  { name: 'Cursor', icon: Sparkles },
  { name: 'Windsurf', icon: Globe },
  { name: 'VS Code + Copilot', icon: GitBranch },
  { name: 'Trae', icon: Cpu },
  { name: 'Cline', icon: Terminal },
  { name: 'Cherry Studio', icon: Sparkles },
]

const mcpConfig = `{
  "mcpServers": {
    "omnisockit": {
      "command": "npx",
      "args": ["@omnisockit/mcp-server"]
    }
  }
}`

const copied = ref(false)
function copyConfig() {
  navigator.clipboard.writeText(mcpConfig)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <div class="home-custom" :class="{ 'is-visible': visible }">

    <!-- ══ Hero ══ -->
    <section class="hc-hero">
      <div class="hc-hero-bg">
        <div class="hc-hero-grid" />
        <div class="hc-hero-glow hc-hero-glow--1" />
        <div class="hc-hero-glow hc-hero-glow--2" />
      </div>
      <div class="hc-container hc-hero-content">
        <div class="hc-badge anim-slide" style="--d:0">
          <Zap :size="14" />
          <span>Empower Your AI · Open Source · Apache 2.0</span>
        </div>

        <h1 class="hc-hero-title anim-slide" style="--d:1">
          <span class="hc-typed-text">{{ typedText.split('Skills')[0] }}</span><span v-if="typedText.includes('Skills')" class="hc-accent">Skills</span><span class="hc-cursor" :class="{ 'hc-cursor--blink': typingDone }">|</span>
        </h1>
        <p class="hc-hero-sub anim-slide" style="--d:2">让你的 AI 大模型成为企业微信开发专家</p>
        <p class="hc-hero-sub2 anim-slide" style="--d:2">MCP 一行命令接入 · 结构化 API 参考 · 踩坑指南 · 可复用代码模板</p>

        <div class="hc-hero-actions anim-slide" style="--d:3">
          <a href="/docs/guides/mcp-setup" class="hc-btn hc-btn--primary">
            <Rocket :size="16" />
            MCP 接入指南
          </a>
          <a href="/skills/" class="hc-btn hc-btn--secondary">
            <BookOpen :size="16" />
            浏览 Skills
          </a>
        </div>

        <div class="hc-stats anim-slide" style="--d:4">
          <div v-for="s in stats" :key="s.label" class="hc-stat">
            <component :is="s.icon" :size="16" class="hc-stat-icon" />
            <strong>{{ s.value }}</strong>
            <span>{{ s.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ What ══ -->
    <section class="hc-section anim-section">
      <div class="hc-container">
        <div class="hc-section-head">
          <Target :size="18" class="hc-label-icon" />
          <span class="hc-label">What</span>
        </div>
        <h2>让 AI 从「随机猜」变成「精确查」</h2>
        <p class="hc-subtitle">AI 大模型默认不了解企业微信 API 细节。SKILL 让它精确掌握每一个接口的真实约束。</p>
        <div class="hc-what-compare">
          <div class="hc-what-card hc-what-card--bad">
            <div class="hc-what-tag hc-what-tag--bad"><XCircle :size="14" /> 没有 SKILL</div>
            <div class="hc-chat-bubble">帮我写一个自动发欢迎语的功能</div>
            <div class="hc-chat-reply hc-chat-reply--bad">
              <p>好的，我来帮你写…</p>
              <div class="hc-code-block">
                <code>// ❌ 凭记忆编造 API<br>// ❌ 遗漏 WelcomeCode 20秒时限<br>// ❌ 搞混 follow_user vs follow_info</code>
              </div>
            </div>
          </div>
          <div class="hc-what-card hc-what-card--good">
            <div class="hc-what-tag hc-what-tag--good"><CheckCircle2 :size="14" /> 有 SKILL</div>
            <div class="hc-chat-bubble">帮我写一个自动发欢迎语的功能</div>
            <div class="hc-chat-reply hc-chat-reply--good">
              <p>已加载 <strong>wecom-crm-customer</strong>，注意：</p>
              <ul>
                <li><CheckCircle2 :size="12" /> 监听 add_half_external_contact 回调</li>
                <li><CheckCircle2 :size="12" /> WelcomeCode 有效期仅 <strong>20 秒</strong></li>
                <li><CheckCircle2 :size="12" /> 先 GET /externalcontact/get 获取渠道</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ MCP ══ -->
    <section class="hc-section hc-section--mcp anim-section">
      <div class="hc-container">
        <div class="hc-section-head">
          <Cpu :size="18" class="hc-label-icon" />
          <span class="hc-label">MCP</span>
        </div>
        <h2>最优雅的接入方式</h2>
        <p class="hc-subtitle">一行配置，让你的 AI 工具自动获取企微开发知识</p>

        <div class="hc-mcp-grid">
          <div class="hc-mcp-code">
            <div class="hc-mcp-code-header">
              <span class="hc-mcp-code-dot hc-mcp-code-dot--r" />
              <span class="hc-mcp-code-dot hc-mcp-code-dot--y" />
              <span class="hc-mcp-code-dot hc-mcp-code-dot--g" />
              <span class="hc-mcp-code-title">mcp.json</span>
              <button class="hc-mcp-copy" @click="copyConfig">
                <Copy v-if="!copied" :size="14" />
                <CheckCircle2 v-else :size="14" />
                {{ copied ? '已复制' : '复制' }}
              </button>
            </div>
            <pre class="hc-mcp-code-body"><code>{{ mcpConfig }}</code></pre>
          </div>
          <div class="hc-mcp-features">
            <div class="hc-mcp-feature">
              <div class="hc-mcp-feature-icon" style="--fc: #14b8a6">
                <Zap :size="20" />
              </div>
              <div>
                <h4>零配置</h4>
                <p>不需要 API Key、不需要 Docker、不需要服务器。安装 Node.js 即可使用。</p>
              </div>
            </div>
            <div class="hc-mcp-feature">
              <div class="hc-mcp-feature-icon" style="--fc: #8b5cf6">
                <Target :size="20" />
              </div>
              <div>
                <h4>按需加载</h4>
                <p>AI 只读取当前需要的 SKILL，不会信息过载，不浪费上下文窗口。</p>
              </div>
            </div>
            <div class="hc-mcp-feature">
              <div class="hc-mcp-feature-icon" style="--fc: #f59e0b">
                <Shield :size="20" />
              </div>
              <div>
                <h4>零风险</h4>
                <p>不调用任何外部 API，只提供知识。你的代码、你的控制。</p>
              </div>
            </div>
          </div>
        </div>

        <div class="hc-mcp-cta">
          <a href="/docs/guides/mcp-setup" class="hc-btn hc-btn--primary">
            <Rocket :size="16" />
            查看 MCP 配置指南
          </a>
          <a href="https://www.npmjs.com/package/@omnisockit/mcp-server" target="_blank" class="hc-btn hc-btn--secondary">
            npm 包 <ExternalLink :size="14" />
          </a>
        </div>
        <p class="hc-mcp-hint">兼容所有主流 AI 工具 · 更多平台 · 即将到来</p>
      </div>
    </section>

    <!-- ══ Why ══ -->
    <section class="hc-section hc-section--alt anim-section">
      <div class="hc-container">
        <div class="hc-section-head">
          <Shield :size="18" class="hc-label-icon" />
          <span class="hc-label">Why</span>
        </div>
        <h2>核心价值</h2>
        <p class="hc-subtitle">不只是文档搬运，而是为 AI 深度优化的知识工程</p>
        <div class="hc-why-grid">
          <div v-for="(v, i) in values" :key="v.title" class="hc-why-card" :style="{ '--vc': v.color, '--i': i }">
            <div class="hc-why-icon-wrap">
              <component :is="v.icon" :size="24" />
            </div>
            <h3>{{ v.title }}</h3>
            <p>{{ v.desc }}</p>
            <div class="hc-why-bullets">
              <span v-for="b in v.bullets" :key="b" class="hc-bullet">{{ b }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ Capabilities ══ -->
    <section class="hc-section anim-section">
      <div class="hc-container">
        <div class="hc-section-head">
          <Layers :size="18" class="hc-label-icon" />
          <span class="hc-label">Capabilities</span>
        </div>
        <h2>能做什么</h2>
        <p class="hc-subtitle">覆盖企业微信三大开发模式 · 7 大能力域 · 550+ API</p>

        <div class="hc-mode-grid">
          <a v-for="(m, i) in modes" :key="m.title" :href="m.link" class="hc-mode-card" :style="{ '--mc': m.color, '--i': i }">
            <div class="hc-mode-icon-wrap">
              <component :is="m.icon" :size="24" />
            </div>
            <div class="hc-mode-count">{{ m.count }} SKILL</div>
            <h3>{{ m.title }}</h3>
            <p>{{ m.desc }}</p>
            <span class="hc-mode-link">查看详情 <ChevronRight :size="14" /></span>
          </a>
        </div>

        <div class="hc-domain-section">
          <h4 class="hc-domain-heading">企业内部开发 · 7 大能力域</h4>
          <div class="hc-domain-chips">
            <span v-for="d in domains" :key="d.label" class="hc-domain-chip" :style="{ '--dc': d.color }">
              <component :is="d.icon" :size="14" />
              {{ d.label }}
              <strong>{{ d.count }}</strong>
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ How ══ -->
    <section class="hc-section hc-section--alt anim-section">
      <div class="hc-container">
        <div class="hc-section-head">
          <Terminal :size="18" class="hc-label-icon" />
          <span class="hc-label">How</span>
        </div>
        <h2>如何使用</h2>
        <p class="hc-subtitle">四步接入，让 AI 成为企业微信开发专家</p>

        <div class="hc-how-steps">
          <div v-for="(s, i) in howSteps" :key="s.num" class="hc-how-step" :style="{ '--i': i }">
            <div class="hc-how-icon">
              <component :is="s.icon" :size="20" />
            </div>
            <div>
              <div class="hc-how-num">Step {{ s.num }}</div>
              <h4>{{ s.title }}</h4>
              <p>{{ s.desc }}</p>
            </div>
          </div>
        </div>

        <div class="hc-ai-tools">
          <p class="hc-ai-tools-label">兼容所有主流 AI 工具</p>
          <div class="hc-ai-tools-list">
            <span v-for="t in aiTools" :key="t.name" class="hc-ai-tool">
              <component :is="t.icon" :size="14" />
              {{ t.name }}
            </span>
          </div>
          <a href="/docs/guides/mcp-setup" class="hc-btn hc-btn--secondary hc-btn--sm">
            查看 MCP 配置指南 <ArrowRight :size="14" />
          </a>
        </div>
      </div>
    </section>

    <!-- ══ Showcase ══ -->
    <section class="hc-section anim-section">
      <div class="hc-container">
        <div class="hc-section-head">
          <Sparkles :size="18" class="hc-label-icon" />
          <span class="hc-label">Showcase</span>
        </div>
        <h2>实战效果对比</h2>
        <p class="hc-subtitle">同一个开发需求，AI 有无 SKILL 的回答质量差距一目了然</p>

        <div class="hc-showcase-table-wrap">
          <table class="hc-showcase-table">
            <thead>
              <tr>
                <th>维度</th>
                <th class="hc-th-bad"><XCircle :size="12" /> 没有 SKILL</th>
                <th class="hc-th-good"><CheckCircle2 :size="12" /> 有 SKILL</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in compare" :key="row.dim">
                <td class="hc-td-dim">{{ row.dim }}</td>
                <td class="hc-td-bad">{{ row.bad }}</td>
                <td class="hc-td-good">{{ row.good }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="hc-showcase-cta">
          <a href="/docs/showcase/skill-demo-response" class="hc-btn hc-btn--secondary">
            查看完整实战对比 <ExternalLink :size="14" />
          </a>
        </div>
      </div>
    </section>

    <!-- ══ Skills ══ -->
    <section class="hc-section hc-section--alt anim-section">
      <div class="hc-container">
        <div class="hc-section-head">
          <BookOpen :size="18" class="hc-label-icon" />
          <span class="hc-label">Skills</span>
        </div>
        <h2>全部 41 个 Skills</h2>
        <p class="hc-subtitle">每个 SKILL 包含 API 速查 · 参数详情 · 踩坑指南 · 五语言模板</p>
        <div class="hc-skills-cta">
          <a href="/skills/" class="hc-btn hc-btn--primary">
            <Layers :size="16" />
            浏览 Skills 总览
          </a>
          <a href="/skills/enterprise/wecom-core" class="hc-btn hc-btn--secondary">
            从 wecom-core 开始 <ArrowRight :size="14" />
          </a>
        </div>
      </div>
    </section>

    <!-- ══ Open Source ══ -->
    <section class="hc-section anim-section">
      <div class="hc-container">
        <div class="hc-section-head">
          <GitBranch :size="18" class="hc-label-icon" />
          <span class="hc-label">Open Source</span>
        </div>
        <h2>开源共建</h2>
        <p class="hc-subtitle">完全开源，社区驱动，持续进化</p>
        <div class="hc-os-grid">
          <div class="hc-os-card">
            <Shield :size="20" class="hc-os-icon" />
            <h4>Apache 2.0</h4>
            <p>自由使用与修改，含明确专利授权保护</p>
          </div>
          <div class="hc-os-card">
            <Sparkles :size="20" class="hc-os-icon" />
            <h4>持续更新</h4>
            <p>跟踪企微官方 API 变更，保持知识同步</p>
          </div>
          <div class="hc-os-card">
            <Users :size="20" class="hc-os-icon" />
            <h4>贡献指南</h4>
            <p>Fork → 新增/修改 SKILL → 提交 PR</p>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>
