#!/usr/bin/env node
/**
 * WordPress Content Extractor
 * Extracts posts and pages from WordPress REST API and converts to Markdown
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

const WP_BASE = 'https://hondacivicblog.com/wp-json/wp/v2';
const OUTPUT_DIR = path.join(__dirname, '..', 'wp-content');

// Simple HTML to Markdown converter
function htmlToMarkdown(html) {
  if (!html) return '';
  
  let md = html
    // Remove WordPress specific classes and styles
    .replace(/<figure[^>]*class="[^"]*wp-caption[^"]*"[^>]*>/gi, '<figure>')
    .replace(/style="[^"]*"/gi, '')
    .replace(/class="[^"]*"/gi, '')
    
    // Handle images
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '\n![$2]($1)\n')
    .replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '\n![]($1)\n')
    
    // Handle figures and captions
    .replace(/<figcaption[^>]*>(.*?)<\/figcaption>/gi, '*$1*\n')
    .replace(/<figure[^>]*>(.*?)<\/figure>/gis, '$1\n')
    
    // Handle links
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    
    // Handle headings
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '\n##### $1\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '\n###### $1\n')
    
    // Handle formatting
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    
    // Handle lists
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    
    // Handle paragraphs and breaks
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<hr\s*\/?>/gi, '\n---\n')
    
    // Handle blockquotes
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (m, content) => {
      return content.split('\n').map(line => `> ${line.trim()}`).join('\n');
    })
    
    // Handle pre/code blocks
    .replace(/<pre[^>]*>(.*?)<\/pre>/gis, '\n```\n$1\n```\n')
    
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, '')
    
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8230;/g, '…')
    .replace(/&hellip;/g, '…')
    
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  return md;
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function fetchAll(endpoint, perPage = 100) {
  const items = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const url = `${WP_BASE}/${endpoint}?per_page=${perPage}&page=${page}`;
    console.log(`Fetching ${url}`);
    try {
      const data = await fetch(url);
      if (Array.isArray(data) && data.length > 0) {
        items.push(...data);
        page++;
      } else {
        hasMore = false;
      }
    } catch (e) {
      hasMore = false;
    }
  }
  
  return items;
}

async function main() {
  // Create output directories
  await fs.mkdir(path.join(OUTPUT_DIR, 'posts'), { recursive: true });
  await fs.mkdir(path.join(OUTPUT_DIR, 'pages'), { recursive: true });
  await fs.mkdir(path.join(OUTPUT_DIR, 'raw'), { recursive: true });
  
  // Fetch categories and tags first
  console.log('\n=== Fetching Categories ===');
  const categories = await fetchAll('categories');
  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.id] = cat.slug;
  });
  console.log(`Found ${categories.length} categories:`, Object.values(categoryMap));
  
  console.log('\n=== Fetching Tags ===');
  const tags = await fetchAll('tags');
  const tagMap = {};
  tags.forEach(tag => {
    tagMap[tag.id] = tag.slug;
  });
  console.log(`Found ${tags.length} tags`);
  
  // Fetch posts
  console.log('\n=== Fetching Posts ===');
  const posts = await fetchAll('posts');
  console.log(`Found ${posts.length} posts`);
  
  // Save raw posts
  await fs.writeFile(
    path.join(OUTPUT_DIR, 'raw', 'posts.json'),
    JSON.stringify(posts, null, 2)
  );
  
  // Convert and save posts
  for (const post of posts) {
    const postCategories = (post.categories || []).map(id => categoryMap[id]).filter(Boolean);
    const postTags = (post.tags || []).map(id => tagMap[id]).filter(Boolean);
    
    const frontmatter = {
      title: post.title.rendered.replace(/"/g, '\\"'),
      slug: post.slug,
      pubDate: post.date,
      description: post.excerpt.rendered
        .replace(/<[^>]+>/g, '')
        .replace(/\n/g, ' ')
        .trim()
        .slice(0, 160),
      categories: postCategories,
      tags: postTags,
      featuredImage: post.featured_image_src || null,
    };
    
    const content = htmlToMarkdown(post.content.rendered);
    
    const markdown = `---
title: "${frontmatter.title}"
slug: "${frontmatter.slug}"
pubDate: "${frontmatter.pubDate}"
description: "${frontmatter.description}"
categories: ${JSON.stringify(frontmatter.categories)}
tags: ${JSON.stringify(frontmatter.tags)}
featuredImage: ${frontmatter.featuredImage ? `"${frontmatter.featuredImage}"` : 'null'}
---

${content}
`;
    
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'posts', `${post.slug}.md`),
      markdown
    );
    console.log(`  ✓ ${post.slug}`);
  }
  
  // Fetch pages
  console.log('\n=== Fetching Pages ===');
  const pages = await fetchAll('pages');
  console.log(`Found ${pages.length} pages`);
  
  // Save raw pages
  await fs.writeFile(
    path.join(OUTPUT_DIR, 'raw', 'pages.json'),
    JSON.stringify(pages, null, 2)
  );
  
  // Convert and save pages
  for (const page of pages) {
    const frontmatter = {
      title: page.title.rendered.replace(/"/g, '\\"'),
      slug: page.slug,
      pubDate: page.date,
    };
    
    const content = htmlToMarkdown(page.content.rendered);
    
    const markdown = `---
title: "${frontmatter.title}"
slug: "${frontmatter.slug}"
pubDate: "${frontmatter.pubDate}"
---

${content}
`;
    
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'pages', `${page.slug}.md`),
      markdown
    );
    console.log(`  ✓ ${page.slug}`);
  }
  
  // Create summary
  const summary = {
    extractedAt: new Date().toISOString(),
    posts: posts.length,
    pages: pages.length,
    categories: Object.values(categoryMap),
    tags: Object.values(tagMap),
  };
  
  await fs.writeFile(
    path.join(OUTPUT_DIR, 'summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  console.log('\n=== Extraction Complete ===');
  console.log(`Posts: ${posts.length}`);
  console.log(`Pages: ${pages.length}`);
  console.log(`Categories: ${categories.length}`);
  console.log(`Tags: ${tags.length}`);
  console.log(`\nOutput saved to: ${OUTPUT_DIR}`);
}

main().catch(console.error);
