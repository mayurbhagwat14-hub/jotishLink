const fs = require('fs');
const path = require('path');

const srcDir = path.join('c:\\\\Users\\\\madha\\\\Desktop\\\\astrotalk-replica', 'frontend', 'src');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

const regex = /return\s*\(\s*<div[^>]*className="[^"]*min-h-screen[^"]*"[^>]*>\s*<div[^>]*animate-spin[^"]*"[^>]*>.*?<\/div>\s*<\/div>\s*\);/gs;

walk(srcDir, (filepath) => {
    if (!filepath.endsWith('.jsx')) return;
    
    let content = fs.readFileSync(filepath, 'utf-8');
    if (!content.includes('animate-spin')) return;
    
    let updated = content.replace(regex, 'return <SplashScreen />;');
    
    if (updated !== content) {
        if (!updated.includes('SplashScreen')) {
            // calculate relative path to components/SplashScreen
            let relPath = path.relative(path.dirname(filepath), path.join(srcDir, 'components', 'SplashScreen'));
            relPath = relPath.replace(/\\/g, '/');
            if (!relPath.startsWith('.')) relPath = './' + relPath;
            
            const importStmt = `import SplashScreen from '${relPath}';\n`;
            
            // add import after the last import statement
            const lastImportIdx = updated.lastIndexOf('import ');
            if (lastImportIdx !== -1) {
                const endOfLine = updated.indexOf('\n', lastImportIdx) + 1;
                updated = updated.slice(0, endOfLine) + importStmt + updated.slice(endOfLine);
            } else {
                updated = importStmt + updated;
            }
        }
        
        fs.writeFileSync(filepath, updated, 'utf-8');
        console.log('Updated: ' + filepath);
    }
});
