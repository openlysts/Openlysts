import { getCatalogRepositories } from "../services/catalogEngine.js";
import { db } from "../db/index.js";

export default async function getRandomRepo(req, res) {
  try {
    const repos = getCatalogRepositories();
    if (!repos || repos.length === 0) {
      // Fallback to DB if catalog is not warmed up
      const { rows } = await db.query(
        'SELECT id, full_name FROM "Repository" ORDER BY RANDOM() LIMIT 1'
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: true, message: "No repositories found" });
      }
      return res.json({ id: rows[0].id, full_name: rows[0].full_name });
    }
    const randomIndex = Math.floor(Math.random() * repos.length);
    const randomRepo = repos[randomIndex];
    return res.json({ id: randomRepo.id, full_name: randomRepo.full_name });
  } catch (error) {
    console.error("[getRandomRepo] Unexpected error:", error.message);
    return res.status(500).json({ error: true, message: error.message });
  }
}
