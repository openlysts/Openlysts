import { queryRepositoriesCatalog } from './server/services/catalogEngine.js';
console.log(queryRepositoriesCatalog({ search: 'react' }).total);
