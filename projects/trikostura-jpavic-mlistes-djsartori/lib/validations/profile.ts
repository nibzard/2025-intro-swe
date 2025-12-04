import { z } from 'zod';

// URL validation helper
const urlSchema = z.string().url('Nevažeći URL format').optional().or(z.literal(''));

// Hex color validation
const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Boja mora biti u hex formatu (npr. #3B82F6)');

export const profileUpdateSchema = z.object({
  // Basic info
  full_name: z.string().min(2, 'Puno ime mora imati najmanje 2 znaka').max(100, 'Puno ime može imati najviše 100 znakova'),
  bio: z.string().max(500, 'Biografija može imati najviše 500 znakova').optional(),
  university: z.string().max(100, 'Naziv sveučilišta može imati najviše 100 znakova').optional(),
  study_program: z.string().max(100, 'Naziv studija može imati najviše 100 znakova').optional(),

  // Social media links
  github_url: urlSchema,
  linkedin_url: urlSchema,
  website_url: urlSchema,
  twitter_url: urlSchema,

  // Academic info
  year_of_study: z.coerce.number().int().min(1).max(10).optional().or(z.literal('')),
  graduation_year: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal('')),
  academic_interests: z.string().max(500, 'Akademski interesi mogu imati najviše 500 znakova').optional(),

  // Skills (comma-separated or JSON)
  skills: z.string().max(1000, 'Skills lista može imati najviše 1000 znakova').optional(),

  // Profile theme
  profile_color: hexColorSchema.optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
