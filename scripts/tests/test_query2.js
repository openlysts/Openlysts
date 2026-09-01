import { queryRepositoriesCatalog } from './server/services/catalogEngine.js';
const data = queryRepositoriesCatalog({ search: '' });
console.log(JSON.stringify(data).length);
