#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '../src/content');

// Get all markdown files
function getMarkdownFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...getMarkdownFiles(fullPath));
    } else if (item.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Remove broken image markdown
function cleanBrokenImages(content) {
  // Match markdown images with wp-content/uploads URLs
  // ![alt](http://...wp-content/uploads...)
  const regex = /!\[[^\]]*\]\(https?:\/\/[^\s\)]*wp-content\/uploads[^\s\)]*\)/g;
  return content.replace(regex, '');
}

function main() {
  const mdFiles = getMarkdownFiles(CONTENT_DIR);
  console.log(`Found ${mdFiles.length} markdown files\n`);
  
  const affectedFiles = [];
  
  for (const file of mdFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const cleanedContent = cleanBrokenImages(content);
    
    if (content !== cleanedContent) {
      // Count removed images
      const originalMatches = content.match(/!\[[^\]]*\]\(https?:\/\/[^\s\)]*wp-content\/uploads[^\s\)]*\)/g) || [];
      
      fs.writeFileSync(file, cleanedContent);
      const relPath = path.relative(CONTENT_DIR, file);
      affectedFiles.push({ path: relPath, count: originalMatches.length });
      console.log(`✓ Cleaned: ${relPath} (${originalMatches.length} images removed)`);
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Total files cleaned: ${affectedFiles.length}`);
  console.log(`Total images removed: ${affectedFiles.reduce((sum, f) => sum + f.count, 0)}`);
  
  if (affectedFiles.length > 0) {
    console.log(`\nAffected posts (may need replacement images):`);
    affectedFiles.forEach(f => console.log(`  - ${f.path}`));
  }
}

main();
