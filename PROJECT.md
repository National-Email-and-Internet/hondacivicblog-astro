# HondaCivicBlog.com - Astro Migration

**Project:** Convert WordPress site to Astro + Tailwind
**Started:** 2026-02-06
**Status:** 🟡 In Progress

---

## Site Analysis

### Current State
- **Posts:** 62 (mostly 2009-2012)
- **Pages:** 19 (including generation guides, engine specs)
- **Categories:** Articles, Cars, Commercial, DIY Projects, News, Parts, Tuning

### Content Pillars
1. **Generations** - History pages for each Civic generation (1st-8th, need 9th-11th)
2. **Engines** - K-series, B-series, D-series specs and info
3. **DIY Guides** - Turbo builds, swaps, maintenance tutorials
4. **Performance** - Type R, Si specific content
5. **Blog Archive** - Legacy news articles

---

## Information Architecture

```
/                          → Landing + year selector
/generations/              → Generation hub
  /1st-gen-1973-1979/
  /2nd-gen-1980-1983/
  /3rd-gen-1984-1987/
  /4th-gen-1988-1991/
  /5th-gen-1992-1995/
  /6th-gen-1996-2000/
  /7th-gen-2001-2005/
  /8th-gen-2006-2011/
  /9th-gen-2012-2015/      (ADD)
  /10th-gen-2016-2021/     (ADD)
  /11th-gen-2022-present/  (ADD)

/engines/                  → Engine reference
  /k-series/
  /b-series/
  /d-series/
  /vtec-explained/

/guides/                   → DIY tutorials
  /turbo-builds/
  /engine-swaps/
  /suspension/
  /maintenance/

/type-r/                   → Type R hub
/si/                       → Si hub

/blog/                     → Archive
```

---

## Design Direction

### Theme
- Modern, clean, enthusiast-focused
- Dark mode option (car enthusiast preference)
- Red accent color (Honda brand)

### Color Palette
- Primary: #CC0000 (Honda Red)
- Secondary: #1A1A1A (Dark)
- Accent: #FFFFFF (White)
- Background: #F5F5F5 (Light) / #121212 (Dark)

### Typography
- Headings: Bold, modern sans-serif
- Body: Clean, readable

### Key Components
- Year/Generation selector hero
- Timeline navigation
- Spec comparison cards
- Before/after sliders (for mods)
- Video embeds

---

## Phases

### Phase 1: Setup & Design ⏳
- [x] Create Astro project
- [ ] Configure Tailwind with Honda theme
- [ ] Build mockups (homepage, generation page, guide page)
- [ ] Get design approval

### Phase 2: Content Extraction
- [ ] Export WP posts via REST API
- [ ] Export WP pages (generation content)
- [ ] Convert to Markdown
- [ ] Organize by content type

### Phase 3: Build Templates
- [ ] BaseLayout with dark mode toggle
- [ ] Homepage with year selector
- [ ] Generation page template
- [ ] Engine specs template
- [ ] Guide/tutorial template
- [ ] Blog archive

### Phase 4: Content Migration
- [ ] Migrate generation pages
- [ ] Migrate engine specs
- [ ] Migrate DIY guides
- [ ] Migrate blog posts
- [ ] Add missing generations (9th, 10th, 11th)

### Phase 5: Polish
- [ ] SEO optimization
- [ ] Image optimization
- [ ] Pagefind search
- [ ] Comments (Cusdis)

### Phase 6: Deploy
- [ ] Deploy to pilot-web-01
- [ ] SSL certificate
- [ ] DNS cutover
- [ ] Submit sitemap to Search Console

---

## SEO Targets

- "Honda Civic generations"
- "Honda Civic history"
- "[year] Honda Civic specs"
- "K20 engine specs"
- "B-series swap guide"
- "Civic turbo build"
- "Type R vs Si"

---

## Technical Notes

- **Server:** pilot-web-01 (51.79.92.134)
- **Current WP:** https://hondacivicblog.com
- **GA4:** TBD (extract from current site)
- **Repo:** TBD (create on GitHub)
