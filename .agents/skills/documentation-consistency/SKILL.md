---
name: documentation-consistency
description: "Documentation consistency skill for Openlysts. Covers docs-to-code synchronization, README accuracy, API documentation, architecture docs, changelog maintenance, and dead reference detection."
---

# Documentation Consistency Skill

## Role & Identity
Technical Writer ensuring Openlysts' documentation accurately reflects the codebase. Documentation that contradicts code is worse than no documentation.

---

## 1. Documentation Inventory

### Core Documents
| Document | Location | Purpose |
|---|---|---|
| README.md | Project root | Project overview, setup, usage |
| ARCHITECTURE.md | Project root | System architecture, data flows |
| AGENTS.md | Project root | AI agent governance rules |
| SKILLS_AND_RESOURCES.md | Project root | Skills and tech stack index |
| .env.example | Project root | Environment variable reference |
| package.json | Project root | Dependencies, scripts |

### Skill Documents
| Document | Location |
|---|---|
| SKILL.md | `.agents/skills/*/SKILL.md` (23 skills) |

### QA Documents
| Document | Location |
|---|---|
| QA_Audit_V4.md | `QA_Audit/QA_Audit_V4.md` |
| Implementation_Plan.md | `QA_Audit/Implementation_Plan.md` |

---

## 2. Sync Rules

### Rule: README.md Must Match package.json
```bash
# Verify scripts section matches
diff <(grep -A20 '"scripts"' package.json) <(grep -A20 'Scripts' README.md)
```

### Rule: ARCHITECTURE.md Must Match Code Structure
```bash
# Verify directory references exist
grep -oP '`[^`]+/`' ARCHITECTURE.md | while read dir; do
  dir=$(echo "$dir" | tr -d '`/')
  [ -d "$dir" ] || echo "MISSING: $dir"
done
```

### Rule: .env.example Must Match Code
```bash
# Find all process.env usages
grep -roh "process\.env\.[A-Z_]+" server/ src/ | sort -u

# Find all .env.example entries
grep "^[A-Z]" .env.example | awk -F= '{print $1}' | sort -u

# Compare
diff <(grep -roh "process\.env\.[A-Z_]+" server/ src/ | sed 's/process.env.//' | sort -u) \
     <(grep "^[A-Z]" .env.example | awk -F= '{print $1}' | sort -u)
```

### Rule: Scripts in package.json Must Have Corresponding Files
```bash
# Check each script's target file exists
node -e "
const pkg = require('./package.json');
for (const [name, cmd] of Object.entries(pkg.scripts)) {
  const match = cmd.match(/node\s+([^\s]+)/);
  if (match) {
    const fs = require('fs');
    if (!fs.existsSync(match[1])) console.log('MISSING:', name, '→', match[1]);
  }
}
"
```

---

## 3. API Documentation

### Endpoint Documentation Pattern
```markdown
## POST /api/auth/register
**Auth Required**: No
**Rate Limited**: Yes
**Request Body**:
- `name` (string, required): Display name (1-100 chars)
- `email` (string, required): Valid email address
- `password` (string, required): Min 8 chars, uppercase, lowercase, number
- `turnstileToken` (string, required): Cloudflare Turnstile token
- `consent` (boolean, required): Privacy policy consent

**Response 201**:
```json
{
  "success": true,
  "message": "Registration successful.",
  "requiresVerification": true
}
```

**Response 400**: Validation errors
**Response 403**: Registrations disabled
**Response 429**: Rate limit exceeded
```

---

## 4. Dead Reference Detection

### Check All Internal Links
```bash
# Find broken references in docs
grep -roh '\[.*\](\.[^)]*)' *.md | while read -r ref; do
  file=$(echo "$ref" | grep -oP '\(\.[^)]+\)' | tr -d '()')
  [ -f "$file" ] || echo "BROKEN: $ref → $file"
done
```

### Check Skill References
```bash
# Verify all skills referenced in AGENTS.md exist
grep -oP '`[^`]+-skill`' AGENTS.md | while read skill; do
  dir=$(echo "$skill" | tr -d '`')
  [ -d ".agents/skills/$dir" ] || echo "MISSING SKILL: $dir"
done
```

---

## 5. Update Protocol

### When Code Changes
1. Update README.md if scripts or setup changed
2. Update ARCHITECTURE.md if structure changed
3. Update .env.example if new env vars added
4. Update QA_Audit_V4.md findings status after fixes
5. Update Implementation_Plan.md checkbox status

### When Adding Endpoints
1. Document in API section of README
2. Add to ARCHITECTURE.md data flow diagram
3. Update backend-api-integration SKILL.md if new patterns

### When Adding Skills
1. Create `.agents/skills/<name>/SKILL.md`
2. Add to `skills-lock.json`
3. Update `SKILLS_AND_RESOURCES.md`
4. Add to AGENTS.md skill references

---

## 6. Documentation Quality Checklist

### README.md
- [ ] Project description is accurate
- [ ] Setup instructions work from clean clone
- [ ] All scripts listed and documented
- [ ] Environment variables documented
- [ ] Tech stack matches package.json
- [ ] No outdated instructions

### ARCHITECTURE.md
- [ ] Directory structure matches actual
- [ ] Data flow diagrams are current
- [ ] Component relationships accurate
- [ ] Database schema documented

### .env.example
- [ ] All env vars in code are listed
- [ ] Required vs optional marked
- [ ] Default values documented
- [ ] No actual secrets present

### Skills
- [ ] All 23+ skills have SKILL.md
- [ ] skills-lock.json hashes match
- [ ] SKILLS_AND_RESOURCES.md lists all skills
- [ ] No orphaned skill directories

---

## 7. Automated Consistency Check

```bash
#!/bin/bash
echo "=== Documentation Consistency Check ==="

# 1. Check package.json scripts
echo -e "\n--- Script File Check ---"
node -e "
const pkg = require('./package.json');
const fs = require('fs');
for (const [name, cmd] of Object.entries(pkg.scripts)) {
  const match = cmd.match(/node\s+([^\s]+)/);
  if (match && !fs.existsSync(match[1])) console.log('MISSING:', name, '→', match[1]);
}
"

# 2. Check env vars
echo -e "\n--- Environment Variable Check ---"
diff <(grep -roh 'process\.env\.[A-Z_]\+' server/ src/ 2>/dev/null | sed 's/process\.env\.//' | sort -u) \
     <(grep '^[A-Z]' .env.example 2>/dev/null | awk -F= '{print $1}' | sort -u) || true

# 3. Check skill count
echo -e "\n--- Skill Count ---"
ls -d .agents/skills/*/SKILL.md 2>/dev/null | wc -l

echo -e "\n=== Done ==="
```
