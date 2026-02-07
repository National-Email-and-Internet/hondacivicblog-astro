import { defineCollection, z } from 'astro:content';

// Generations collection (1st-11th gen)
const generations = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    generation: z.number(),
    years: z.string(),
    description: z.string().optional(),
    image: z.string().optional(),
    highlights: z.array(z.string()).default([]),
    engines: z.array(z.string()).default([]),
    pubDate: z.coerce.date().optional(),
  }),
});

// Engines collection
const engines = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    series: z.string(), // B-series, K-series, D-series, etc.
    displacement: z.string().optional(),
    power: z.string().optional(),
    torque: z.string().optional(),
    vtec: z.boolean().default(false),
    description: z.string().optional(),
    image: z.string().optional(),
    pubDate: z.coerce.date().optional(),
  }),
});

// Guides collection (DIY tutorials)
const guides = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    category: z.string().default('general'), // turbo, swap, suspension, maintenance
    description: z.string().optional(),
    image: z.string().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
});

// Blog collection (legacy posts)
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    description: z.string().optional(),
    pubDate: z.coerce.date(),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    featuredImage: z.string().nullable().optional(),
  }),
});

// Pages collection (static pages like privacy, terms, etc.)
const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    pubDate: z.coerce.date().optional(),
  }),
});

export const collections = {
  generations,
  engines,
  guides,
  blog,
  pages,
};
