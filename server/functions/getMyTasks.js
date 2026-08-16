import { entities } from '../services/entities.js';

export default async function getMyTasks(req, res) {
  try {
    const user = { id: 'local-admin', email: 'admin@localhost' };

    const [byId, byEmail] = await Promise.all([
      entities.Task.filter({ assignee_id: user.id }, '-created_date', 200),
      user.email
        ? entities.Task.filter({ assignee_email: user.email }, '-created_date', 200)
        : Promise.resolve([]),
    ]);
    const seen = new Set();
    const myTasks = [...byId, ...byEmail].filter(t => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });

    return res.json({ tasks: myTasks });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
}
