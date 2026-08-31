import { queryRepositoriesCatalog } from "../services/catalogEngine.js";

export default async function getRandomRepo(req, res) {
  try {
    const catalogData = queryRepositoriesCatalog({ search: "", page: 1, perPage: 1000 });
    const repos = catalogData.results;
    if (!repos || repos.length === 0) {
      return res.status(404).json({ error: true, message: "No repositories found" });
    }
    const randomIndex = Math.floor(Math.random() * repos.length);
    const randomRepo = repos[randomIndex];
    return res.json({ id: randomRepo.id, full_name: randomRepo.full_name });
  } catch (error) {
    console.error("[getRandomRepo] Unexpected error:", error.message);
    return res.status(500).json({ error: true, message: error.message });
  }
}
