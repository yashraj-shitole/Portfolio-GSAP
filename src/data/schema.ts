import { z } from 'zod'

export const ProfileSchema = z.object({
  name: z.string().min(1),
  tagline: z.string(),
  bio: z.string(),
  avatar: z.string().nullable(),
  location: z.string().nullable(),
  email: z.string().email(),
  stats: z.array(z.object({ label: z.string(), value: z.number(), suffix: z.string() })),
  funFacts: z.array(z.object({ icon: z.string(), label: z.string() })),
})

export const CodeLineSchema = z.object({ type: z.enum(['comment', 'command', 'output']), text: z.string() })
export const CodeHintSchema = z.object({ language: z.string(), lines: z.array(CodeLineSchema) })

export const SectionSchema = z.object({ id: z.string(), title: z.string(), subtitle: z.string() })

export const SkillItemSchema = z.object({ name: z.string(), level: z.number().min(0).max(100) })
export const SkillCategorySchema = z.object({ category: z.string(), items: z.array(SkillItemSchema) })

export const ExperienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  start: z.string(),
  end: z.string().nullable(),
  current: z.boolean().default(false),
  location: z.string().optional(),
  mode: z.string().optional(),
  stack: z.array(z.string()).optional(),
  summary: z.string(),
  highlights: z.array(z.string()),
})

export const TechItemSchema = z.object({ name: z.string(), category: z.string() })
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  tagline: z.string(),
  description: z.string(),
  role: z.string(),
  year: z.number(),
  duration: z.string(),
  team: z.string(),
  url: z.string().nullable(),
  githubUrl: z.string().nullable(),
  language: z.string().nullable(),
  stars: z.number(),
  topics: z.array(z.string()),
  source: z.enum(['github', 'resume']),
  pushedAt: z.string().nullable(),
  techStack: z.array(TechItemSchema),
  features: z.array(z.string()),
  challenges: z.array(z.string()),
  results: z.array(z.string()),
  accentColor: z.string(),
})

export const EducationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  field: z.string().nullable(),
  start: z.string(),
  end: z.string().nullable(),
  stack: z.array(z.string()).optional(),
})

export const AwardSchema = z.object({
  title: z.string(),
  issuer: z.string(),
  date: z.string(),
  description: z.string(),
})

export const PublicationSchema = z.object({
  title: z.string(),
  venue: z.string(),
  date: z.string(),
  description: z.string(),
})

export const ContactSchema = z.object({
  github: z.string().nullable(),
  linkedin: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),
})

export const SiteSchema = z.object({
  name: z.string(),
  title: z.string(),
  description: z.string(),
  loader: z.object({
    logoText: z.string(),
    messages: z.array(z.string()),
    messageIntervalMs: z.number(),
    minDurationMs: z.number(),
  }),
})

export const PortfolioSchema = z.object({
  site: SiteSchema,
  profile: ProfileSchema,
  codeHint: CodeHintSchema,
  sections: z.array(SectionSchema),
  skills: z.array(SkillCategorySchema),
  experience: z.array(ExperienceSchema),
  projects: z.array(ProjectSchema),
  education: z.array(EducationSchema),
  awards: z.array(AwardSchema),
  publications: z.array(PublicationSchema),
  contact: ContactSchema,
})

export type Portfolio = z.infer<typeof PortfolioSchema>
export type Project = z.infer<typeof ProjectSchema>
export type Experience = z.infer<typeof ExperienceSchema>
export type SkillCategory = z.infer<typeof SkillCategorySchema>
export type SkillItem = z.infer<typeof SkillItemSchema>
export type Award = z.infer<typeof AwardSchema>
export type Publication = z.infer<typeof PublicationSchema>
