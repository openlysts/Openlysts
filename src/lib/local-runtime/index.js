import { auth } from './auth.js';
import { entities } from './entities.js';
import { functions } from './functions.js';

export const localRuntime = {
  auth,
  entities,
  functions,
  users: {
    async inviteUser(email, role) {
      return functions.invoke('inviteUser', { email, role });
    }
  },
  asServiceRole: {
    entities
  }
};
