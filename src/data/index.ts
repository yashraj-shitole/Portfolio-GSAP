import portfolioJson from './portfolio.json'
import { PortfolioSchema, type Portfolio, type Project, type Experience, type SkillCategory, type SkillItem, type Award, type Publication } from './schema'

// Single source of truth for portfolio data. Validated at module load;
// the build fails loudly if the JSON doesn't match the schema.
const parsed = PortfolioSchema.safeParse(portfolioJson)
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('portfolio.json failed validation:', parsed.error.format())
  throw new Error('portfolio.json is invalid. Run `pnpm run extract` or fix the file.')
}

export const data: Portfolio = parsed.data
export type { Portfolio, Project, Experience, SkillCategory, SkillItem, Award, Publication }
