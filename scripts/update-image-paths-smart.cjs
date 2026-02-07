#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '../src/content');
const IMAGES_DIR = path.join(__dirname, '../public/images/wp-uploads');

// Build index of available images with fuzzy matching
function indexImages(dir, prefix = '') {
  const index = { exact: {}, fuzzy: {} };
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      const sub = indexImages(fullPath, prefix + item.name + '/');
      Object.assign(index.exact, sub.exact);
      Object.assign(index.fuzzy, sub.fuzzy);
    } else {
      const localPath = '/images/wp-uploads/' + prefix + item.name;
      const key = item.name.toLowerCase();
      index.exact[key] = localPath;
      
      // Also create fuzzy key (remove size suffix like -300x200)
      const fuzzyKey = key.replace(/-\d+x\d+(\.[a-z]+)$/i, '$1');
      if (!index.fuzzy[fuzzyKey]) index.fuzzy[fuzzyKey] = [];
      index.fuzzy[fuzzyKey].push({ name: item.name, path: localPath });
    }
  }
  return index;
}

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

function findBestMatch(filename, index) {
  const key = filename.toLowerCase();
  
  // Try exact match first
  if (index.exact[key]) return index.exact[key];
  
  // Try fuzzy match (same base name, different size)
  const fuzzyKey = key.replace(/-\d+x\d+(\.[a-z]+)$/i, '$1');
  if (index.fuzzy[fuzzyKey] && index.fuzzy[fuzzyKey].length > 0) {
    // Return first match (prefer larger sizes)
    return index.fuzzy[fuzzyKey][0].path;
  }
  
  return null;
}

function main() {
  console.log('Indexing available images...');
  const imageIndex = indexImages(IMAGES_DIR);
  console.log(`Found ${Object.keys(imageIndex.exact).length} images\n`);

  const mdFiles = getMarkdownFiles(CONTENT_DIR);
  console.log(`Processing ${mdFiles.length} markdown files...\n`);

  let totalReplaced = 0;
  let totalMissing = 0;
  const missingImages = new Set();

  for (const file of mdFiles) {
    let content = fs.readFileSync(file, 'utf-8');
    let changed = false;
    let fileReplaced = 0;
    let fileMissing = 0;

    const regex = /!\[([^\]]*)\]\((https?:\/\/[^\s\)]*wp-content\/uploads\/[^\s\)]*)\)/g;
    
    content = content.replace(regex, (match, alt, url) => {
      const filename = path.basename(url);
      const localPath = findBestMatch(filename, imageIndex);
      
      if (localPath) {
        fileReplaced++;
        changed = true;
        return `![${alt}](${localPath})`;
      } else {
        fileMissing++;
        missingImages.add(url);
        // Remove broken image entirely
        return '';
      }
    });

    if (changed) {
      fs.writeFileSync(file, content);
      const relPath = path.relative(CONTENT_DIR, file);
      if (fileMissing > 0) {
        console.log(`✓ ${relPath}: ${fileReplaced} replaced, ${fileMissing} removed`);
      } else {
        console.log(`✓ ${relPath}: ${fileReplaced} replaced`);
      }
    }
    
    totalReplaced += fileReplaced;
    totalMissing += fileMissing;
  }

  console.log(`\n=== Summary ===`);
  console.log(`Images replaced: ${totalReplaced}`);
  console.log(`Images removed (unavailable): ${totalMissing}`);
  
  if (missingImages.size > 0) {
    console.log(`\nRemoved URLs (${missingImages.size}):`);
    [...missingImages].forEach(url => console.log(`  - ${path.basename(url)}`));
  }
}

main();
