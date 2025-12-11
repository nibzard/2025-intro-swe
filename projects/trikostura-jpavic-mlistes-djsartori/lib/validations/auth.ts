import { z } from 'zod';

// Reserved usernames that cannot be used
const RESERVED_USERNAMES = [
  'admin', 'administrator', 'moderator', 'mod', 'support', 'help',
  'system', 'root', 'superuser', 'user', 'guest', 'null', 'undefined',
  'api', 'www', 'forum', 'blog', 'shop', 'store', 'mail', 'email',
  'test', 'demo', 'example', 'sample', 'official', 'staff', 'team'
];

// Password strength validation
const passwordSchema = z
  .string()
  .min(8, 'Lozinka mora imati najmanje 8 znakova')
  .max(100, 'Lozinka može imati najviše 100 znakova')
  .regex(/[a-z]/, 'Lozinka mora sadržavati bar jedno malo slovo')
  .regex(/[A-Z]/, 'Lozinka mora sadržavati bar jedno veliko slovo')
  .regex(/[0-9]/, 'Lozinka mora sadržavati bar jednu brojku')
  .regex(/[^a-zA-Z0-9]/, 'Lozinka mora sadržavati bar jedan poseban znak (!@#$%^&*...)');

// Username validation with strict rules
const usernameSchema = z
  .string()
  .min(3, 'Korisničko ime mora imati najmanje 3 znaka')
  .max(20, 'Korisničko ime može imati najviše 20 znakova')
  .regex(/^[a-zA-Z]/, 'Korisničko ime mora početi sa slovom')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Korisničko ime može sadržavati samo slova, brojeve, _ i -')
  .regex(/^(?!.*[_-]{2})/, 'Korisničko ime ne može imati uzastopne _ ili -')
  .regex(/[a-zA-Z0-9]$/, 'Korisničko ime mora završiti sa slovom ili brojem')
  .refine(
    (username) => !RESERVED_USERNAMES.includes(username.toLowerCase()),
    'Ovo korisničko ime je rezervirano i ne može se koristiti'
  );

// Full name validation
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

// Email validation with academic domain preference
const emailSchema = z
  .string()
  .email('Nevažeća email adresa')
  .min(5, 'Email adresa je prekratka')
  .max(100, 'Email adresa je preduga')
  .toLowerCase()
  .refine(
    (email) => !email.includes('..'),
    'Email adresa ne smije sadržavati uzastopne točke'
  );

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Lozinka je obavezna'),
});

export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  full_name: fullNameSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Lozinke se ne podudaraju',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
