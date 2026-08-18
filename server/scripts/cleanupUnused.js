import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

function checkUnusedFiles() {
  console.log('🧹 Starting cleanup check...');
  
  // 1. Check Unused Frontend Pages
  const pagesDir = path.join(ROOT_DIR, 'src', 'pages');
  const appJsx = fs.readFileSync(path.join(ROOT_DIR, 'src', 'App.jsx'), 'utf8');
  
  if (fs.existsSync(pagesDir)) {
    const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx') || f.endsWith('.tsx'));
    let removedPages = 0;
    
    for (const page of pages) {
      const pageName = page.replace(/\.(jsx|tsx)$/, '');
      // If it's not imported in App.jsx, it's considered orphaned in this architecture
      if (!appJsx.includes(pageName)) {
        console.log(`[Frontend] Removing orphaned page: src/pages/${page}`);
        fs.unlinkSync(path.join(pagesDir, page));
        removedPages++;
      }
    }
    console.log(`✅ Removed ${removedPages} unused frontend pages.`);
  }

  // 2. Check Unused Backend Functions
  const functionsDir = path.join(ROOT_DIR, 'server', 'functions');
  const apiRouterPath = path.join(ROOT_DIR, 'server', 'api', 'functions.js');
  const apiRouter = fs.readFileSync(apiRouterPath, 'utf8');
  const serverIndex = fs.readFileSync(path.join(ROOT_DIR, 'server', 'index.js'), 'utf8');

  if (fs.existsSync(functionsDir)) {
    const functions = fs.readdirSync(functionsDir).filter(f => f.endsWith('.js'));
    let removedFunctions = 0;
    
    // We also want to know if the frontend uses them.
    // The frontend uses functions via POST /api/functions/[name]
    // Let's do a simple heuristic: if it's not used in App.jsx (via pages) and not called in any active pages
    // actually, let's just grep the active pages + components.
    
    const srcDir = path.join(ROOT_DIR, 'src');
    const getAllFiles = (dirPath, arrayOfFiles) => {
      const files = fs.readdirSync(dirPath);
      arrayOfFiles = arrayOfFiles || [];
      files.forEach(file => {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
          arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
          arrayOfFiles.push(path.join(dirPath, "/", file));
        }
      });
      return arrayOfFiles;
    };
    
    const allSrcFiles = getAllFiles(srcDir);
    const srcContent = allSrcFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');
    
    for (const funcFile of functions) {
      const funcName = funcFile.replace('.js', '');
      
      const isUsedInFrontend = srcContent.includes(`'${funcName}'`) || srcContent.includes(`"${funcName}"`) || srcContent.includes(`\`${funcName}\``);
      const isUsedInServerIndex = serverIndex.includes(funcName);
      
      // Some functions might be referenced in backend but not frontend (like auto ingestion)
      if (!isUsedInFrontend && !isUsedInServerIndex) {
        console.log(`[Backend] Removing unused function: server/functions/${funcFile}`);
        fs.unlinkSync(path.join(functionsDir, funcFile));
        removedFunctions++;
        
        // Let's remove it from api/functions.js too (simple regex)
        let updatedRouter = fs.readFileSync(apiRouterPath, 'utf8');
        updatedRouter = updatedRouter.replace(new RegExp(`import\\s+${funcName}\\s+from.*\\n`, 'g'), '');
        updatedRouter = updatedRouter.replace(new RegExp(`\\s+${funcName},?\\n`, 'g'), '\n');
        fs.writeFileSync(apiRouterPath, updatedRouter, 'utf8');
      }
    }
    console.log(`✅ Removed ${removedFunctions} unused backend functions.`);
  }
  
  console.log('✨ Cleanup complete!');
}

checkUnusedFiles();
