const fs = require('fs');
const path = require('path');

const dirs = [
  'c:/Users/madha/Desktop/astrotalk-replica/frontend/src/pages/admin',
  'c:/Users/madha/Desktop/astrotalk-replica/frontend/src/pages/astrologer',
  'c:/Users/madha/Desktop/astrotalk-replica/frontend/src/pages/user'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // We want to replace `<div className="... animate-fade-in ...">` only if it's the root div.
    // Usually the root div is right after `return (`.
    // Let's just find `return (\n    <div className="... animate-fade-in ...">`
    const regex = /return \(\s*<div className="([^"]*)animate-fade-in([^"]*)"/g;
    
    if (regex.test(content)) {
      content = content.replace(regex, 'return (\n    <div className="$1$2"');
      // clean up double spaces in className
      content = content.replace(/className="([^"]*)  ([^"]*)"/g, 'className="$1 $2"');
      content = content.replace(/className=" ([^"]*)"/g, 'className="$1"');
      content = content.replace(/className="([^"]*) "/g, 'className="$1"');
      
      fs.writeFileSync(filePath, content);
      console.log('Fixed', filePath);
    }
  });
});
