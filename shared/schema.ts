// Shared validation schemas used by serverless functions
// This project does not use a database. Keep only simple Zod schemas
// needed by the API (contact form validation).
import { z } from "zod";

export const contactMessageSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().trim().email("Invalid email address"),
  message: z
    .string()
    .trim()
    .min(5, "Message must be at least 5 characters")
    .max(1000, "Message too long"),
});

export type ContactMessage = z.infer<typeof contactMessageSchema>;
