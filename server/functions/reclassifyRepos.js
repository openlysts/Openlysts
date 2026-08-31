import { entities } from '../services/entities.js';
import { db } from '../db/index.js';
import { classifyRepo } from '../shared/openlyst.js';

export default async function reclassifyRepos(req, res) {
  try {
    const repos = await entities.Repository.list('-created_date', 2000);
    const updates = [];
    
    for (const repo of repos) {
      const categories = classifyRepo(
        { name: repo.name, description: repo.description, topics: repo.topics },
        null
      );
      updates.push({ id: repo.id, categories });
    }

    if (updates.length > 0) {
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        
        // Chunk into 1000 records to be safe with parameter limits
        const chunkSize = 1000;
        for (let i = 0; i < updates.length; i += chunkSize) {
          const chunk = updates.slice(i, i + chunkSize);
          let updateQuery = `UPDATE "Repository" SET categories = CASE id `;
          const values = [];
          const idList = [];
          
          for (let j = 0; j < chunk.length; j++) {
            const { id, categories } = chunk[j];
            const idParam = `$${j * 2 + 1}`;
            const catParam = `$${j * 2 + 2}`;
            values.push(id, JSON.stringify(categories));
            updateQuery += `WHEN ${idParam} THEN ${catParam}::jsonb `;
            idList.push(idParam);
          }
          
          updateQuery += `END WHERE id IN (${idList.join(', ')})`;
          await client.query(updateQuery, values);
        }
        
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    return res.json({ status: 'success', repos_updated: updates.length });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
}
