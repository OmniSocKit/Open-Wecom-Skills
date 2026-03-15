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
  { value: '75+', label: 'Callbacks', icon: GitBranch },
  { value: 'MCP', label: 'One-Line Setup', icon: Cpu },
  { value: '5', label: 'Languages', icon: Terminal },
]

const modes = [
  { icon: Building2, title: 'Enterprise Development', count: 30, color: '#3b82f6', desc: 'Self-built apps covering Auth, CRM, Office, and 7 capability domains', link: '/en/skills/enterprise/wecom-core' },
  { icon: Link2, title: 'ISV Development', count: 8, color: '#8b5cf6', desc: 'Triple-token system + dual-channel callbacks + license management', link: '/en/skills/isv/wecom-isv-core' },
  { icon: Package, title: 'Third-Party Apps', count: 3, color: '#f59e0b', desc: 'Marketplace distribution · ID encryption · Data API integration', link: '/en/skills/third-party/wecom-3rd-quickstart' },
]

const values = [
  { icon: Crosshair, title: 'Precise API Knowledge', desc: 'Every endpoint with exact parameters, response structures, and constraints', bullets: ['Endpoint-level precision', 'Traceable doc_id', 'Complete param types'], color: '#14b8a6' },
  { icon: Shield, title: 'Gotcha Guide', desc: 'Real-world pitfalls, field ambiguities, and time-sensitive constraints', bullets: ['WelcomeCode 20s limit', 'remark_mobiles overwrite', 'linkedcorp all-POST'], color: '#f59e0b' },
  { icon: Rocket, title: 'Ready-to-Use Templates', desc: 'Code templates in Python / TypeScript / Go / Java / PHP', bullets: ['5-language standards', 'Auto pagination', 'Error code mapping'], color: '#8b5cf6' },
]

const howSteps = [
  { num: '01', title: 'Add MCP Config', desc: 'Add one JSON config to your AI tool', icon: Terminal },
  { num: '02', title: 'AI Auto-Discovers', desc: 'AI automatically finds 41 WeCom SKILLs to read', icon: Sparkles },
  { num: '03', title: 'Ask a Question', desc: 'Chat normally with AI, it reads SKILLs on demand', icon: GitBranch },
  { num: '04', title: 'Precise Output', desc: 'Generates code with precise knowledge, auto-avoids pitfalls', icon: CheckCircle2 },
]

const compare = [
  { dim: 'API Path', bad: 'May fabricate non-existent endpoints', good: 'Precise to /externalcontact/resigned/transfer_customer' },
  { dim: 'Field Ambiguity', bad: 'Unaware of follow_user vs follow_info difference', good: 'Proactively flags as CRITICAL gotcha' },
  { dim: 'Transfer Types', bad: 'Confuses on-job and resigned transfer', good: 'Provides 6-dimension comparison table' },
  { dim: 'Chat Archive', bad: 'May fabricate HTTP API', good: 'Clearly states C/C++ SDK required' },
  { dim: 'Error Handling', bad: 'Thinks errcode=0 means all success', good: 'Reminds to check each customer[].errcode' },
]

const domains = [
  { icon: Zap, label: 'Core', count: 6, color: '#3b82f6' },
  { icon: Users, label: 'CRM', count: 8, color: '#07C160' },
  { icon: Briefcase, label: 'Office', count: 8, color: '#f97316' },
  { icon: Headphones, label: 'Service', count: 1, color: '#a855f7' },
  { icon: Smartphone, label: 'Client', count: 3, color: '#eab308' },
  { icon: Database, label: 'Advanced', count: 3, color: '#94a3b8' },
  { icon: Factory, label: 'Industry', count: 1, color: '#ef4444' },
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
        <p class="hc-hero-sub anim-slide" style="--d:2">Make Your AI Model a WeCom Development Expert</p>
        <p class="hc-hero-sub2 anim-slide" style="--d:2">One-line MCP setup · Structured API references · Gotcha guides · Reusable code templates</p>

        <div class="hc-hero-actions anim-slide" style="--d:3">
          <a href="/en/docs/guides/mcp-setup" class="hc-btn hc-btn--primary">
            <Rocket :size="16" />
            MCP Setup Guide
          </a>
          <a href="/en/skills/" class="hc-btn hc-btn--secondary">
            <BookOpen :size="16" />
            Browse Skills
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
        <h2>Turn AI from "Random Guessing" to "Precise Querying"</h2>
        <p class="hc-subtitle">AI models don't understand WeCom API details by default. SKILLs give them precise knowledge of every endpoint's real constraints.</p>
        <div class="hc-what-compare">
          <div class="hc-what-card hc-what-card--bad">
            <div class="hc-what-tag hc-what-tag--bad"><XCircle :size="14" /> Without SKILL</div>
            <div class="hc-chat-bubble">Build me an auto welcome message feature</div>
            <div class="hc-chat-reply hc-chat-reply--bad">
              <p>Sure, let me write that…</p>
              <div class="hc-code-block">
                <code>// ❌ Fabricates API from memory<br>// ❌ Misses WelcomeCode 20s expiry<br>// ❌ Confuses follow_user vs follow_info</code>
              </div>
            </div>
          </div>
          <div class="hc-what-card hc-what-card--good">
            <div class="hc-what-tag hc-what-tag--good"><CheckCircle2 :size="14" /> With SKILL</div>
            <div class="hc-chat-bubble">Build me an auto welcome message feature</div>
            <div class="hc-chat-reply hc-chat-reply--good">
              <p>Loaded <strong>wecom-crm-customer</strong>, note:</p>
              <ul>
                <li><CheckCircle2 :size="12" /> Listen for add_half_external_contact callback</li>
                <li><CheckCircle2 :size="12" /> WelcomeCode valid for only <strong>20 seconds</strong></li>
                <li><CheckCircle2 :size="12" /> First GET /externalcontact/get to fetch channel</li>
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
        <h2>The Most Elegant Integration</h2>
        <p class="hc-subtitle">One config line, let your AI tool automatically access WeCom development knowledge</p>

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
                {{ copied ? 'Copied' : 'Copy' }}
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
                <h4>Zero Config</h4>
                <p>No API Key, no Docker, no server. Just install Node.js and go.</p>
              </div>
            </div>
            <div class="hc-mcp-feature">
              <div class="hc-mcp-feature-icon" style="--fc: #8b5cf6">
                <Target :size="20" />
              </div>
              <div>
                <h4>On-Demand Loading</h4>
                <p>AI reads only the SKILL it needs. No context overload, no wasted tokens.</p>
              </div>
            </div>
            <div class="hc-mcp-feature">
              <div class="hc-mcp-feature-icon" style="--fc: #f59e0b">
                <Shield :size="20" />
              </div>
              <div>
                <h4>Zero Risk</h4>
                <p>No external API calls, knowledge-only. Your code, your control.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="hc-mcp-cta">
          <a href="/en/docs/guides/mcp-setup" class="hc-btn hc-btn--primary">
            <Rocket :size="16" />
            View MCP Setup Guide
          </a>
          <a href="https://www.npmjs.com/package/@omnisockit/mcp-server" target="_blank" class="hc-btn hc-btn--secondary">
            npm Package <ExternalLink :size="14" />
          </a>
        </div>
        <p class="hc-mcp-hint">Compatible with all mainstream AI tools · More platforms · Coming soon</p>
      </div>
    </section>

    <!-- ══ Why ══ -->
    <section class="hc-section hc-section--alt anim-section">
      <div class="hc-container">
        <div class="hc-section-head">
          <Shield :size="18" class="hc-label-icon" />
          <span class="hc-label">Why</span>
        </div>
        <h2>Core Value</h2>
        <p class="hc-subtitle">Not just a documentation mirror, but knowledge engineering deeply optimized for AI</p>
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
        <h2>What It Can Do</h2>
        <p class="hc-subtitle">Covering 3 WeCom development modes · 7 capability domains · 550+ APIs</p>

        <div class="hc-mode-grid">
          <a v-for="(m, i) in modes" :key="m.title" :href="m.link" class="hc-mode-card" :style="{ '--mc': m.color, '--i': i }">
            <div class="hc-mode-icon-wrap">
              <component :is="m.icon" :size="24" />
            </div>
            <div class="hc-mode-count">{{ m.count }} SKILL</div>
            <h3>{{ m.title }}</h3>
            <p>{{ m.desc }}</p>
            <span class="hc-mode-link">View Details <ChevronRight :size="14" /></span>
          </a>
        </div>

        <div class="hc-domain-section">
          <h4 class="hc-domain-heading">Enterprise Development · 7 Capability Domains</h4>
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
        <h2>How to Use</h2>
        <p class="hc-subtitle">Four steps to make AI your WeCom development expert</p>

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
          <p class="hc-ai-tools-label">Compatible with all mainstream AI tools</p>
          <div class="hc-ai-tools-list">
            <span v-for="t in aiTools" :key="t.name" class="hc-ai-tool">
              <component :is="t.icon" :size="14" />
              {{ t.name }}
            </span>
          </div>
          <a href="/en/docs/guides/mcp-setup" class="hc-btn hc-btn--secondary hc-btn--sm">
            View MCP Setup Guide <ArrowRight :size="14" />
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
        <h2>Real-World Comparison</h2>
        <p class="hc-subtitle">Same dev request — the quality gap between AI with and without SKILLs is crystal clear</p>

        <div class="hc-showcase-table-wrap">
          <table class="hc-showcase-table">
            <thead>
              <tr>
                <th>Dimension</th>
                <th class="hc-th-bad"><XCircle :size="12" /> Without SKILL</th>
                <th class="hc-th-good"><CheckCircle2 :size="12" /> With SKILL</th>
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
          <a href="/en/docs/showcase/skill-demo-response" class="hc-btn hc-btn--secondary">
            View Full Comparison <ExternalLink :size="14" />
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
        <h2>All 41 Skills</h2>
        <p class="hc-subtitle">Each SKILL includes API quick reference · Parameter details · Gotcha guide · 5-language templates</p>
        <div class="hc-skills-cta">
          <a href="/en/skills/" class="hc-btn hc-btn--primary">
            <Layers :size="16" />
            Browse Skills Overview
          </a>
          <a href="/en/skills/enterprise/wecom-core" class="hc-btn hc-btn--secondary">
            Start with wecom-core <ArrowRight :size="14" />
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
        <h2>Open Source Community</h2>
        <p class="hc-subtitle">Fully open source, community-driven, continuously evolving</p>
        <div class="hc-os-grid">
          <div class="hc-os-card">
            <Shield :size="20" class="hc-os-icon" />
            <h4>Apache 2.0</h4>
            <p>Free to use and modify, with explicit patent protection</p>
          </div>
          <div class="hc-os-card">
            <Sparkles :size="20" class="hc-os-icon" />
            <h4>Continuously Updated</h4>
            <p>Tracks official WeCom API changes to keep knowledge in sync</p>
          </div>
          <div class="hc-os-card">
            <Users :size="20" class="hc-os-icon" />
            <h4>Contribution Guide</h4>
            <p>Fork → Add/Modify SKILL → Submit PR</p>
          </div>
        </div>
        <div class="hc-os-platforms">
          <a href="https://github.com/OmniSocKit/Open-Wecom-Skills" target="_blank" class="hc-btn hc-btn--secondary hc-btn--sm">
            <GitBranch :size="14" /> GitHub
          </a>
          <a href="https://gitee.com/omni-soc-kit/open-wecom-skills" target="_blank" class="hc-btn hc-btn--secondary hc-btn--sm">
            <GitBranch :size="14" /> Gitee
          </a>
          <a href="https://gitcode.com/omnisockit/OpenWecomSkills" target="_blank" class="hc-btn hc-btn--secondary hc-btn--sm">
            <GitBranch :size="14" /> GitCode
          </a>
        </div>
      </div>
    </section>

  </div>
</template>
