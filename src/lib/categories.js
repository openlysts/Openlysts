export const CATEGORIES = [
  { slug: 'ai', label: 'AI', description: 'Artificial intelligence projects, tools, and frameworks.' },
  { slug: 'llms', label: 'LLMs', description: 'Large language models and model tooling.' },
  { slug: 'local-ai', label: 'Local AI', description: 'Run AI models locally and privately.' },
  { slug: 'ai-agents', label: 'AI Agents', description: 'Autonomous and agentic AI systems.' },
  { slug: 'rag', label: 'RAG', description: 'Retrieval-augmented generation and vector search.' },
  { slug: 'machine-learning', label: 'Machine Learning', description: 'ML frameworks, libraries, and tooling.' },
  { slug: 'web-applications', label: 'Web Applications', description: 'Open-source web apps you can self-host.' },
  { slug: 'developer-tools', label: 'Developer Tools', description: 'Tools that make developers more productive.' },
  { slug: 'self-hosted', label: 'Self-Hosted', description: 'Software you can host on your own infrastructure.' },
  { slug: 'databases', label: 'Databases', description: 'Open-source databases and data stores.' },
  { slug: 'automation', label: 'Automation', description: 'Workflow automation and orchestration tools.' },
  { slug: 'libraries-frameworks', label: 'Libraries & Frameworks', description: 'Reusable libraries and frameworks.' },
  { slug: 'cloud-devops', label: 'Cloud & DevOps', description: 'Cloud infrastructure, containers, and DevOps tooling.' },
  { slug: 'security-auth', label: 'Security', description: 'Security, authentication, and authorization tools.' },
  { slug: 'observability', label: 'Observability', description: 'Logging, metrics, tracing, and OpenTelemetry.' },
  { slug: 'workflow-automation', label: 'Workflow & Automation', description: 'Self-hosted Zapier/n8n alternatives and orchestration.' },
  { slug: 'data-lakehouse', label: 'Data & Lakehouse', description: 'Modern data stacks, DuckDB, Iceberg, and lakehouses.' },
  { slug: 'wasm-runtimes', label: 'Wasm & Runtimes', description: 'WebAssembly, Bun, Deno, and next-gen runtimes.' },
  { slug: 'sovereign-infra', label: 'Sovereign Infra', description: 'Self-hostable infrastructure and BaaS platforms.' },
];

export function getCategory(slug) {
  return CATEGORIES.find((c) => c.slug === slug);
}