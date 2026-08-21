// Openlyst shared logic — license verification, categorization, scoring
// Used by runIngestion, recalculateScores, reclassifyRepos backend functions

const OSI_LICENSES = new Set([
  "mit", "apache-2.0", "bsd-2-clause", "bsd-3-clause",
  "gpl-2.0", "gpl-3.0", "lgpl-2.1", "lgpl-3.0",
  "agpl-3.0", "mpl-2.0",
]);

const NON_OSS_HINTS = ["proprietary", "source-available", "source available", "commercial", "non-commercial", "cc-by-nc", "no-license"];

export function verifyLicense(license) {
  if (!license || !license.spdx_id || license.spdx_id === "NOASSERTION" || license.spdx_id === "NONE") {
    return { status: "unknown", key: null, name: null, url: null };
  }
  const key = license.spdx_id.toLowerCase();
  if (OSI_LICENSES.has(key)) {
    return { status: "verified_oss", key, name: license.name || key, url: license.url || "" };
  }
  const nameLower = (license.name || "").toLowerCase();
  if (NON_OSS_HINTS.some((h) => nameLower.includes(h))) {
    return { status: "non_oss", key, name: license.name || key, url: license.url || "" };
  }
  return { status: "unknown", key, name: license.name || key, url: license.url || "" };
}

const CATEGORY_RULES = [
  { category: "AI", keywords: ["artificial intelligence", " ai ", "ai-powered", "machine learning", "deep learning", "neural network", "generative ai"], topics: ["ai", "artificial-intelligence", "machine-learning", "deep-learning", "generative-ai"] },
  { category: "LLMs", keywords: ["llm", "large language model", "language model", "gpt", "bert", "transformer", "chatgpt"], topics: ["llm", "large-language-models", "language-model", "gpt", "transformer", "chatgpt", "llama"] },
  { category: "Local AI", keywords: ["local ai", "local llm", "local model", "on-device", "edge ai", "offline ai"], topics: ["local-ai", "local-llm", "on-device-ai", "edge-ai", "ollama", "llama-cpp"] },
  { category: "AI Agents", keywords: ["ai agent", "autonomous agent", "agentic", "multi-agent", "agent framework", "autonomous"], topics: ["ai-agents", "autonomous-agents", "agents", "agentic", "multi-agent", "agent-framework"] },
  { category: "RAG", keywords: ["rag", "retrieval augmented", "retrieval-augmented", "vector search", "embedding", "semantic search"], topics: ["rag", "retrieval-augmented-generation", "vector-search", "embeddings", "semantic-search", "vector-database"] },
  { category: "Machine Learning", keywords: ["machine learning", "deep learning", "tensorflow", "pytorch", "scikit", "neural network", "ml framework"], topics: ["machine-learning", "deep-learning", "ml", "tensorflow", "pytorch", "scikit-learn", "neural-network"] },
  { category: "Web Applications", keywords: ["web app", "web application", "self-hosted app", "full stack", "fullstack", "saas"], topics: ["web-app", "web-application", "self-hosted", "fullstack", "saas", "dashboard"] },
  { category: "Developer Tools", keywords: ["developer tool", "devtool", "command-line", "cli tool", "terminal", "developer productivity", "ide", "linter"], topics: ["developer-tools", "devtools", "cli", "command-line", "terminal", "ide", "linter", "developer-productivity"] },
  { category: "Self-Hosted", keywords: ["self-hosted", "selfhosted", "self hosted", "homelab", "host your own", "self host"], topics: ["self-hosted", "selfhosted", "homelab", "self-hosting"] },
  { category: "Databases", keywords: ["database", "sql", "nosql", "datastore", "storage engine", "key-value store", "vector database"], topics: ["database", "sql", "nosql", "db", "datastore", "key-value", "vector-database"] },
  { category: "Automation", keywords: ["automation", "workflow", "automate", "pipeline", "ci/cd", "orchestration", "scheduler"], topics: ["automation", "workflow", "ci-cd", "orchestration", "pipeline", "scheduler", "automation-tool"] },
  { category: "Libraries & Frameworks", keywords: ["library", "framework", "sdk", "package", "module", "toolkit"], topics: ["library", "framework", "sdk", "package", "module", "toolkit"] },
  { category: "Cloud & DevOps", keywords: ["cloud", "devops", "kubernetes", "docker", "container", "infrastructure", "terraform", "ansible", "helm", "serverless", "microservice"], topics: ["cloud", "devops", "kubernetes", "docker", "containers", "infrastructure", "terraform", "ansible", "helm", "serverless", "cloud-native", "iaas", "paas", "k8s"] },
  { category: "Security", keywords: ["security", "authentication", "authorization", "auth", "sso", "oauth", "encryption", "firewall", "vulnerability", "pentest", "cybersecurity"], topics: ["security", "authentication", "authorization", "auth", "sso", "oauth", "encryption", "cybersecurity", "vulnerability", "pentesting", "identity"] },
];

const QUERY_HINT_MAP = {
  "LLM": "LLMs", "AI": "AI", "generative AI": "AI", "AI agents": "AI Agents",
  "RAG": "RAG", "local AI": "Local AI", "local LLM": "Local AI",
  "Ollama": "Local AI", "llama.cpp": "Local AI", "machine learning": "Machine Learning",
  "AI framework": "Libraries & Frameworks", "self-hosted": "Self-Hosted",
  "open-source web application": "Web Applications", "developer tools": "Developer Tools",
  "automation": "Automation", "databases": "Databases", "developer productivity": "Developer Tools",
};

export function classifyRepo(repo, queryHint) {
  const categories = new Set();
  const desc = (repo.description || "").toLowerCase();
  const name = (repo.name || "").toLowerCase();
  const topics = (repo.topics || []).map((t) => t.toLowerCase());
  const topicSet = new Set(topics);
  const text = ` ${name} ${desc} ${topics.join(" ")} `;

  for (const rule of CATEGORY_RULES) {
    let match = false;
    for (const kw of rule.keywords) {
      if (text.includes(kw)) { match = true; break; }
    }
    if (!match) {
      for (const t of rule.topics) {
        if (topicSet.has(t)) { match = true; break; }
      }
    }
    if (match) categories.add(rule.category);
  }

  if (queryHint && QUERY_HINT_MAP[queryHint]) {
    categories.add(QUERY_HINT_MAP[queryHint]);
  }

  return Array.from(categories);
}

export function calculateQualityScore(repo) {
  let score = 0;
  score += Math.min(40, Math.log10(Math.max(1, repo.stars || 0)) * 10);
  score += Math.min(20, Math.log10(Math.max(1, repo.forks || 0)) * 6);
  const updated = new Date(repo.github_updated_at || 0);
  const daysSinceUpdate = (Date.now() - updated.getTime()) / 86400000;
  if (daysSinceUpdate < 30) score += 20;
  else if (daysSinceUpdate < 90) score += 15;
  else if (daysSinceUpdate < 180) score += 10;
  else if (daysSinceUpdate < 365) score += 5;
  if (repo.license_status === "verified_oss") score += 10;
  else if (repo.license_status === "unknown") score += 3;
  if (!repo.archived) score += 5;
  const created = new Date(repo.github_created_at || 0);
  const ageYears = (Date.now() - created.getTime()) / (365 * 86400000);
  score += Math.min(5, ageYears);
  return Math.round(Math.min(100, score) * 10) / 10;
}

export function calculateTrendingScore(g24, g7, g30) {
  return Math.round(((g24 || 0) * 3 + (g7 || 0) * 2 + (g30 || 0)) * 10) / 10;
}

export function computeStarsGained(snapshots, currentStars) {
  const now = Date.now();
  let g24 = 0, g7 = 0, g30 = 0;
  const sorted = [...snapshots].sort((a, b) => new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime());
  const findStarsAt = (daysAgo) => {
    const cutoff = now - daysAgo * 86400000;
    for (const s of sorted) {
      if (new Date(s.snapshot_date).getTime() <= cutoff) return s.stars;
    }
    return sorted.length > 0 ? sorted[sorted.length - 1].stars : currentStars;
  };
  const stars24hAgo = findStarsAt(1);
  const stars7dAgo = findStarsAt(7);
  const stars30dAgo = findStarsAt(30);
  g24 = Math.max(0, (currentStars || 0) - (stars24hAgo || 0));
  g7 = Math.max(0, (currentStars || 0) - (stars7dAgo || 0));
  g30 = Math.max(0, (currentStars || 0) - (stars30dAgo || 0));
  return { g24, g7, g30 };
}

export function calculateEngagementScore(repo, g30) {
  // Heuristic engagement score without needing individual issue/PR queries
  // High weight for recent stars (g30) and open issues activity relative to stars
  let score = 0;
  score += Math.min(50, (g30 || 0) * 2); // Up to 50 points from recent 30d star growth
  
  if (repo.open_issues > 0) {
    const issueToStarRatio = repo.open_issues / Math.max(1, repo.stars);
    // Ideal ratio implies active community but not overwhelmed (e.g. 1 issue per 50 stars)
    if (issueToStarRatio > 0.01 && issueToStarRatio < 0.1) score += 20;
    else if (issueToStarRatio >= 0.1) score += 10;
  }
  
  // Penalize dead projects (archived or old update)
  const updated = new Date(repo.github_updated_at || 0);
  const daysSinceUpdate = (Date.now() - updated.getTime()) / 86400000;
  if (repo.archived || daysSinceUpdate > 365) score -= 30;
  else if (daysSinceUpdate < 14) score += 30; // Highly responsive
  else if (daysSinceUpdate < 60) score += 15;

  return Math.max(0, Math.min(100, score)); // Clamp between 0-100
}

export function calculateAuthorityScore(repo) {
  // Simple heuristic for dependency pagerank / authority
  // Real pagerank requires analyzing full dependency trees which is offline-only
  // Heuristic: Very high stars (>10k) + high forks relative to stars implies foundational library
  let score = 0;
  if (repo.stars > 10000) score += 40;
  else if (repo.stars > 5000) score += 20;

  const forkRatio = (repo.forks || 0) / Math.max(1, repo.stars);
  if (forkRatio > 0.15) score += 30; // High fork ratio = lots of developers customizing/relying on it
  else if (forkRatio > 0.05) score += 15;
  
  // foundational topics
  const topics = (repo.topics || []).map(t => t.toLowerCase());
  if (topics.some(t => ['framework', 'library', 'database', 'language', 'infrastructure'].includes(t))) {
    score += 30;
  }
  
  return Math.min(100, score);
}

export const CATEGORIES = [
  { slug: "ai", label: "AI", description: "Artificial intelligence projects, tools, and frameworks." },
  { slug: "llms", label: "LLMs", description: "Large language models and model tooling." },
  { slug: "local-ai", label: "Local AI", description: "Run AI models locally and privately." },
  { slug: "ai-agents", label: "AI Agents", description: "Autonomous and agentic AI systems." },
  { slug: "rag", label: "RAG", description: "Retrieval-augmented generation and vector search." },
  { slug: "machine-learning", label: "Machine Learning", description: "ML frameworks, libraries, and tooling." },
  { slug: "web-applications", label: "Web Applications", description: "Open-source web apps you can self-host." },
  { slug: "developer-tools", label: "Developer Tools", description: "Tools that make developers more productive." },
  { slug: "self-hosted", label: "Self-Hosted", description: "Software you can host on your own infrastructure." },
  { slug: "databases", label: "Databases", description: "Open-source databases and data stores." },
  { slug: "automation", label: "Automation", description: "Workflow automation and orchestration tools." },
  { slug: "libraries-frameworks", label: "Libraries & Frameworks", description: "Reusable libraries and frameworks." },
  { slug: "cloud-devops", label: "Cloud & DevOps", description: "Cloud infrastructure, containers, and DevOps tooling." },
  { slug: "security-auth", label: "Security", description: "Security, authentication, and authorization tools." },
];

export function slugToLabel(slug) {
  const cat = CATEGORIES.find((c) => c.slug === slug);
  return cat ? cat.label : slug;
}

export function labelToSlug(label) {
  const cat = CATEGORIES.find((c) => c.label === label);
  return cat ? cat.slug : label.toLowerCase().replace(/\s+/g, "-");
}

export function autoClassifyDifficulty(repo) {
  const topics = (repo.topics || []).map((t) => t.toLowerCase());
  const desc = (repo.description || "").toLowerCase();
  
  if (topics.includes('good-first-issue') || topics.includes('beginner-friendly') || topics.includes('education') || topics.includes('tutorial') || topics.includes('learning')) {
    return 'Beginner';
  }
  if (desc.includes('beginner friendly') || desc.includes('good first issue')) {
    return 'Beginner';
  }
  
  if (topics.includes('kernel') || topics.includes('operating-system') || topics.includes('compiler') || topics.includes('distributed-systems') || repo.language === 'C' || repo.language === 'Rust' || repo.language === 'C++') {
    if (repo.stars > 5000) {
      return 'Pro';
    }
  }
  
  if (repo.open_issues > 1000) {
    return 'Pro';
  }
  
  return 'Intermediate';
}
