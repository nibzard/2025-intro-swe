import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Nevažeća email adresa'),
  password: z.string().min(6, 'Lozinka mora imati najmanje 6 znakova'),
});

export const registerSchema = z.object({
  email: z.string().email('Nevažeća email adresa'),
  username: z
    .string()
    .min(3, 'Korisničko ime mora imati najmanje 3 znaka')
    .max(20, 'Korisničko ime može imati najviše 20 znakova')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Korisničko ime može sadržavati samo slova, brojeve i _'
    ),
  full_name: z.string().min(2, 'Puno ime mora imati najmanje 2 znaka'),
  password: z.string().min(6, 'Lozinka mora imati najmanje 6 znakova'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Lozinke se ne podudaraju',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
