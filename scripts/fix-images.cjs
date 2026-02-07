#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const CONTENT_DIR = path.join(__dirname, '../src/content');
const IMAGES_DIR = path.join(__dirname, '../public/images/wp-uploads');

// Ensure images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
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

// Extract image URLs from markdown
function extractImageUrls(content) {
  const regex = /https?:\/\/[^\s\)]+wp-content\/uploads[^\s\)]+/g;
  return [...new Set(content.match(regex) || [])];
}

// Generate local filename from URL
function urlToFilename(url) {
  // Extract just the filename part
  const urlPath = new URL(url).pathname;
  const parts = urlPath.split('/');
  const filename = parts[parts.length - 1];
  // Add a hash prefix to avoid collisions
  const hash = url.split('/').slice(-3, -1).join('-').replace(/[^a-z0-9-]/gi, '');
  return `${hash}-${filename}`;
}

// Download a file
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function main() {
  const mdFiles = getMarkdownFiles(CONTENT_DIR);
  console.log(`Found ${mdFiles.length} markdown files`);
  
  // Collect all unique URLs
  const allUrls = new Set();
  for (const file of mdFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const urls = extractImageUrls(content);
    urls.forEach(url => allUrls.add(url));
  }
  
  console.log(`Found ${allUrls.size} unique image URLs`);
  
  // Create URL to local path mapping
  const urlMap = {};
  for (const url of allUrls) {
    urlMap[url] = `/images/wp-uploads/${urlToFilename(url)}`;
  }
  
  // Download images
  let downloaded = 0;
  let failed = 0;
  for (const [url, localPath] of Object.entries(urlMap)) {
    const destPath = path.join(__dirname, '../public', localPath);
    if (fs.existsSync(destPath)) {
      console.log(`✓ Already exists: ${path.basename(localPath)}`);
      downloaded++;
      continue;
    }
    
    try {
      await downloadFile(url, destPath);
      console.log(`✓ Downloaded: ${path.basename(localPath)}`);
      downloaded++;
    } catch (err) {
      console.log(`✗ Failed: ${url} - ${err.message}`);
      failed++;
      // Remove from map so we don't replace in content
      delete urlMap[url];
    }
  }
  
  console.log(`\nDownloaded: ${downloaded}, Failed: ${failed}`);
  
  // Update markdown files
  let filesUpdated = 0;
  for (const file of mdFiles) {
    let content = fs.readFileSync(file, 'utf-8');
    let changed = false;
    
    for (const [url, localPath] of Object.entries(urlMap)) {
      if (content.includes(url)) {
        content = content.split(url).join(localPath);
        changed = true;
      }
    }
    
    if (changed) {
      fs.writeFileSync(file, content);
      console.log(`Updated: ${path.basename(file)}`);
      filesUpdated++;
    }
  }
  
  console.log(`\nUpdated ${filesUpdated} markdown files`);
}

main().catch(console.error);
