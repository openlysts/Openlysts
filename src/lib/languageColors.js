// GitHub language colors — subset of the most common languages
const LANGUAGE_COLORS = {
  Python: '#3572A5', JavaScript: '#f1e05a', TypeScript: '#3178c6',
  Go: '#00ADD8', Rust: '#dea584', Java: '#b07219', C: '#555555',
  'C++': '#f34b7d', 'C#': '#178600', Ruby: '#701516', PHP: '#4F5D95',
  Swift: '#F05138', Kotlin: '#A97BFF', Dart: '#00B4AB', Scala: '#c22d40',
  Shell: '#89e051', HTML: '#e34c26', CSS: '#563d7c', Vue: '#41b883',
  Svelte: '#ff3e00', Jupyter: '#DA5B0B', Lua: '#000080', R: '#198CE7',
  Elixir: '#6e4a7e', Haskell: '#5e5086', Clojure: '#db5855', Zig: '#ec915c',
  Nim: '#ffc200', Crystal: '#000100', OCaml: '#3be133', 'Objective-C': '#438eff',
  Perl: '#0298c3', Julia: '#a270ba', D: '#ba595e',
  PowerShell: '#012456', Makefile: '#427819', Dockerfile: '#384d54',
  'Jupyter Notebook': '#DA5B0B', Astro: '#ff5a03', Solidity: '#AA6746',
};

export function getLanguageColor(lang) {
  if (!lang) return '#8b949e';
  return LANGUAGE_COLORS[lang] || '#8b949e';
}