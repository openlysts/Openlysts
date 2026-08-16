import { entities } from '../services/entities.js';
import { slugToLabel } from '../shared/openlyst.js';

const PER_PAGE = 24;

export default async function queryRepositories(req, res) {
  try {
    const body = req.body || {};

    const {
      q = '',
      categories = [],
      languages = [],
      licenses = [],
      minStars = 0,
      updatedWithin = '',
      activity = '',
      sort = 'trending',
      page = 1,
    } = body;

    const allRepos = await entities.Repository.list('-created_date', 3000);
    let repos = allRepos.filter((r) => !r.hidden);

    if (q && q.trim()) {
      const query = q.trim().toLowerCase();
      repos = repos.filter((r) => {
        const haystack = [
          r.name, r.full_name, r.description, r.owner, r.language,
          (r.topics || []).join(' '), (r.categories || []).join(' '),
        ].join(' ').toLowerCase();
        return haystack.includes(query);
      });
    }

    if (categories && categories.length > 0) {
      const labels = categories.map(slugToLabel);
      repos = repos.filter((r) =>
        labels.some((label) => (r.categories || []).includes(label))
      );
    }

    if (languages && languages.length > 0) {
      repos = repos.filter((r) => languages.includes(r.language));
    }

    if (licenses && licenses.length > 0) {
      repos = repos.filter((r) => licenses.includes(r.license_status));
    }

    if (minStars && minStars > 0) {
      repos = repos.filter((r) => (r.stars || 0) >= minStars);
    }

    if (updatedWithin) {
      const days = { '24h': 1, '7d': 7, '30d': 30, '6mo': 180, '1yr': 365 }[updatedWithin];
      if (days) {
        const cutoff = Date.now() - days * 86400000;
        repos = repos.filter((r) => new Date(r.github_updated_at || 0).getTime() >= cutoff);
      }
    }

    if (activity) {
      if (activity === 'archived') {
        repos = repos.filter((r) => r.archived);
      } else if (activity === 'active') {
        repos = repos.filter((r) => !r.archived && new Date(r.github_updated_at || 0).getTime() >= Date.now() - 90 * 86400000);
      } else if (activity === 'recently-active') {
        repos = repos.filter((r) => !r.archived && new Date(r.github_updated_at || 0).getTime() >= Date.now() - 365 * 86400000);
      }
    }

    const sortFns = {
      trending: (a, b) => (b.trending_score || 0) - (a.trending_score || 0),
      stars: (a, b) => (b.stars || 0) - (a.stars || 0),
      updated: (a, b) => new Date(b.github_updated_at || 0).getTime() - new Date(a.github_updated_at || 0).getTime(),
      recent: (a, b) => new Date(b.last_ingested_at || 0).getTime() - new Date(a.last_ingested_at || 0).getTime(),
    };
    repos.sort(sortFns[sort] || sortFns.trending);

    const total = repos.length;
    const totalPages = Math.ceil(total / PER_PAGE);
    const pageNum = Math.max(1, Math.min(page, totalPages || 1));
    const offset = (pageNum - 1) * PER_PAGE;
    const results = repos.slice(offset, offset + PER_PAGE);

    return res.json({ results, total, page: pageNum, totalPages, perPage: PER_PAGE });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
}
