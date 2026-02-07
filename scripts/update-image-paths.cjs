#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '../src/content');
const IMAGES_DIR = path.join(__dirname, '../public/images/wp-uploads');

// Build index of available images
function indexImages(dir, prefix = '') {
  const index = {};
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      Object.assign(index, indexImages(fullPath, prefix + item.name + '/'));
    } else {
      // Index by filename (case-insensitive)
      const key = item.name.toLowerCase();
      index[key] = '/images/wp-uploads/' + prefix + item.name;
    }
  }
  return index;
}

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

function main() {
  console.log('Indexing available images...');
  const imageIndex = indexImages(IMAGES_DIR);
  console.log(`Found ${Object.keys(imageIndex).length} images\n`);

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

    // Match markdown images with wp-content/uploads URLs
    const regex = /!\[([^\]]*)\]\((https?:\/\/[^\s\)]*wp-content\/uploads\/[^\s\)]*)\)/g;
    
    content = content.replace(regex, (match, alt, url) => {
      // Extract filename from URL
      const filename = path.basename(url).toLowerCase();
      
      if (imageIndex[filename]) {
        fileReplaced++;
        changed = true;
        return `![${alt}](${imageIndex[filename]})`;
      } else {
        fileMissing++;
        missingImages.add(url);
        // Keep original (will be broken, but we'll report it)
        return match;
      }
    });

    if (changed) {
      fs.writeFileSync(file, content);
      const relPath = path.relative(CONTENT_DIR, file);
      console.log(`✓ ${relPath}: ${fileReplaced} replaced, ${fileMissing} missing`);
    }
    
    totalReplaced += fileReplaced;
    totalMissing += fileMissing;
  }

  console.log(`\n=== Summary ===`);
  console.log(`Images replaced: ${totalReplaced}`);
  console.log(`Images missing: ${totalMissing}`);
  
  if (missingImages.size > 0) {
    console.log(`\nMissing image URLs (${missingImages.size}):`);
    [...missingImages].slice(0, 20).forEach(url => console.log(`  - ${url}`));
    if (missingImages.size > 20) {
      console.log(`  ... and ${missingImages.size - 20} more`);
    }
  }
}

main();
