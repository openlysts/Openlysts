/**
 * Environment & Configuration Sanity Checker for Openlysts
 * Validates all required environment variables and config before startup
 *
 * Usage:
 *   node scripts/sanity/check-env.js
 *   npm run sanity:env
 */

const REQUIRED_VARS = [
  { name: 'DATABASE_URL', pattern: /^postgresql:\/\//, description: 'PostgreSQL connection string' },
  { name: 'SESSION_SECRET', minLength: 32, description: 'Session encryption key' },
  { name: 'SESSION_PASSWORD', minLength: 32, description: 'Session cookie password' },
];

const RECOMMENDED_VARS = [
  { name: 'GOOGLE_CLIENT_ID', description: 'Google OAuth client ID' },
  { name: 'GOOGLE_CLIENT_SECRET', description: 'Google OAuth client secret' },
  { name: 'GITHUB_CLIENT_ID', description: 'GitHub OAuth client ID' },
  { name: 'GITHUB_CLIENT_SECRET', description: 'GitHub OAuth client secret' },
  { name: 'TURNSTILE_SECRET_KEY', description: 'Cloudflare Turnstile secret' },
  { name: 'SMTP_HOST', description: 'Email SMTP host' },
  { name: 'SMTP_USER', description: 'Email SMTP username' },
];

const FORBIDDEN_VALUES = [
  'change-me',
  'placeholder',
  'your-',
  'example',
  'TODO',
  'CHANGEME',
  'xxx',
  'test',
];

let errors = 0;
let warnings = 0;

function check(name, value, config) {
  if (!value) {
    if (config.required !== false) {
      console.error(`  ❌ ${name}: MISSING — ${config.description}`);
      errors++;
    } else {
      console.warn(`  ⚠️  ${name}: not set — ${config.description}`);
      warnings++;
    }
    return;
  }

  // Check for forbidden placeholder values
  const lowerVal = value.toLowerCase();
  if (FORBIDDEN_VALUES.some((f) => lowerVal.includes(f))) {
    console.error(`  ❌ ${name}: appears to be a placeholder value`);
    errors++;
    return;
  }

  // Check minimum length
  if (config.minLength && value.length < config.minLength) {
    console.error(`  ❌ ${name}: too short (${value.length} chars, minimum ${config.minLength})`);
    errors++;
    return;
  }

  // Check pattern
  if (config.pattern && !config.pattern.test(value)) {
    console.error(`  ❌ ${name}: invalid format — ${config.description}`);
    errors++;
    return;
  }

  // Mask sensitive values
  const masked = value.substring(0, 6) + '***' + value.substring(value.length - 4);
  console.log(`  ✅ ${name}: ${masked}`);
}

console.log('');
console.log('🔍 Environment Sanity Check');
console.log('===========================');
console.log('');

console.log('Required Variables:');
REQUIRED_VARS.forEach((v) => check(v.name, process.env[v.name], v));

console.log('');
console.log('Recommended Variables:');
RECOMMENDED_VARS.forEach((v) => check(v.name, process.env[v.name], { ...v, required: false }));

console.log('');
console.log(`Results: ${errors} error(s), ${warnings} warning(s)`);

if (errors > 0) {
  console.error('');
  console.error('❌ Environment check FAILED. Fix the errors above before starting.');
  process.exit(1);
} else {
  console.log('');
  console.log('✅ Environment check passed.');
  process.exit(0);
}
