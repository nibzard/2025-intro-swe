import { z } from 'zod';

// Full name validation (same as in auth.ts)
const fullNameSchema = z
  .string()
  .min(2, 'Puno ime mora imati najmanje 2 znaka')
  .max(100, 'Puno ime može imati najviše 100 znakova')
  .regex(/^[a-zA-ZčćžšđČĆŽŠĐ\s'-]+$/, 'Puno ime može sadržavati samo slova, razmake i znakove \' i -')
  .refine(
    (name) => name.trim().split(/\s+/).length >= 2,
    'Molimo unesite ime i prezime'
  )
  .refine(
    (name) => name.trim().split(/\s+/).every(part => part.length >= 2),
    'Ime i prezime moraju imati najmanje 2 znaka'
  );

// Bio validation with minimum length when provided
const bioSchema = z
  .string()
  .max(500, 'Biografija može imati najviše 500 znakova')
  .refine(
    (bio) => !bio || bio.trim().length === 0 || bio.trim().length >= 10,
    'Biografija mora imati najmanje 10 znakova ako je unesena'
  )
  .optional();

// University and program validation
const universitySchema = z
  .string()
  .max(100, 'Naziv sveučilišta može imati najviše 100 znakova')
  .refine(
    (val) => !val || val.trim().length === 0 || val.trim().length >= 3,
    'Naziv sveučilišta mora imati najmanje 3 znaka ako je unesen'
  )
  .optional();

const studyProgramSchema = z
  .string()
  .max(100, 'Naziv studija može imati najviše 100 znakova')
  .refine(
    (val) => !val || val.trim().length === 0 || val.trim().length >= 3,
    'Naziv studija mora imati najmanje 3 znaka ako je unesen'
  )
  .optional();

// Domain-specific URL validation
const githubUrlSchema = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine(
    (url) => !url || url === '' || /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9-]+\/?$/i.test(url),
    'GitHub URL mora biti u formatu: https://github.com/username'
  );

const linkedinUrlSchema = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine(
    (url) => !url || url === '' || /^https?:\/\/(www\.)?linkedin\.com\/(in|pub)\/[a-zA-Z0-9-]+\/?$/i.test(url),
    'LinkedIn URL mora biti u formatu: https://linkedin.com/in/username'
  );

const twitterUrlSchema = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine(
    (url) => !url || url === '' || /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?$/i.test(url),
    'Twitter/X URL mora biti u formatu: https://twitter.com/username ili https://x.com/username'
  );

const websiteUrlSchema = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine(
    (url) => {
      if (!url || url === '') return true;
      try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
      } catch {
        return false;
      }
    },
    'Website mora biti važeći URL (npr. https://example.com)'
  );

// Hex color validation
const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Boja mora biti u hex formatu (npr. #3B82F6)');

// Academic interests validation
const academicInterestsSchema = z
  .string()
  .max(500, 'Akademski interesi mogu imati najviše 500 znakova')
  .refine(
    (val) => !val || val.trim().length === 0 || val.trim().length >= 10,
    'Akademski interesi moraju imati najmanje 10 znakova ako su uneseni'
  )
  .optional();

// Skills validation
const skillsSchema = z
  .string()
  .max(1000, 'Skills lista može imati najviše 1000 znakova')
  .refine(
    (val) => !val || val.trim().length === 0 || val.trim().split(',').length >= 1,
    'Unesite najmanje jednu vještinu'
  )
  .optional();

// Year validation
const currentYear = new Date().getFullYear();
const graduationYearSchema = z.coerce
  .number()
  .int()
  .min(currentYear - 10, `Godina završetka ne može biti prije ${currentYear - 10}`)
  .max(currentYear + 15, `Godina završetka ne može biti nakon ${currentYear + 15}`)
  .optional()
  .or(z.literal(''));

export const profileUpdateSchema = z.object({
  // Basic info
  full_name: fullNameSchema,
  bio: bioSchema,
  university: universitySchema,
  study_program: studyProgramSchema,

  // Social media links with domain-specific validation
  github_url: githubUrlSchema,
  linkedin_url: linkedinUrlSchema,
  website_url: websiteUrlSchema,
  twitter_url: twitterUrlSchema,

  // Academic info
  year_of_study: z.coerce.number().int().min(1, 'Godina studija mora biti između 1 i 10').max(10, 'Godina studija mora biti između 1 i 10').optional().or(z.literal('')),
  graduation_year: graduationYearSchema,
  academic_interests: academicInterestsSchema,

  // Skills (comma-separated)
  skills: skillsSchema,

  // Profile theme
  profile_color: hexColorSchema.optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
