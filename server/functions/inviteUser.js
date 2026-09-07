import { entities } from '../services/entities.js';
import crypto from 'crypto';

export default async function inviteUser(req, res) {
  try {
    const { email, role } = req.body || {};
    if (!email || !role) {
      return res.status(400).json({ error: true, message: 'email and role are required' });
    }

    const token = crypto.randomBytes(16).toString('hex');
    
    await entities.Invitation.create({
      email,
      role,
      token,
      status: 'pending'
    });

    console.log(`[Local Runtime] Mock generated invitation for ${email} with role ${role}. Acceptance token: ${token}`);

    return res.json({ success: true, message: 'Invitation created locally' });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
}
