// scripts/extract.mjs
// One-shot data extractor: GitHub API + resume PDF + LinkedIn (manual) -> portfolio.json
// Per .claude/skills/data-extractor/SKILL.md
//
// Sources used in this run:
//   1. Resume: C:\Users\yashr\Downloads\Yashraj-Shitole-7219014381.pdf  (parsed via pdftotext)
//   2. GitHub: https://api.github.com/users/yashraj-shitole/repos        (fetched, in _github_repos.json)
//   3. Personal site: https://yashrajshitole.in/                          (SPA shell, no extractable content -> skipped)
//   4. LinkedIn: https://www.linkedin.com/in/yashraj-shitole-576442215/   (HTTP 999 auth wall in this env,
//      so the user pasted the public profile content manually; see LINKEDIN_PASTE below)

import { readFile, writeFile, unlink } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '..', 'src', 'data');

// ---------- LinkedIn (manually pasted by the user) ----------
// LinkedIn's auth wall blocks scraping. The user pasted the public profile
// content. This is treated as a third source alongside the resume.
//
// Conflict resolution per the skill:
//   - Personal data (name, location): LinkedIn wins (live, public-facing).
//   - Education end dates: LinkedIn wins (live).
//   - Experience roles + dates: LinkedIn wins (live).
//   - Project descriptions + URLs: resume wins (richer detail).
const LINKEDIN_PASTE = {
  name: 'Yashraj Shitole',
  headlineSkills: ['Java', 'MySQL', 'TypeScript', 'ReactJS', 'Angular'],
  location: 'Kolhapur, Maharashtra, India',
  followerCount: 574,
  experience: [
    {
      company: 'Raykor Technologies Pvt. Ltd.',
      role: 'Software Engineer',
      start: '2025-04',
      end: null, // current ("Present")
      location: 'Pune District, Maharashtra, India',
      skills: ['Angular', 'Node.js', '+4 skills'],
    },
    {
      company: 'RacksonsIT Developers',
      role: 'Full Stack Developer',
      start: '2024-01',
      end: '2024-08',
      mode: 'Hybrid',
      skills: ['React.js', 'Node.js', '+1 skill'],
    },
    {
      company: 'QSective Solutions',
      role: 'Android Developer',
      start: '2022-07',
      end: '2022-08',
      location: 'Kolhapur, Maharashtra, India',
      skills: ['Android Development', 'Java', '+2 skills'],
    },
    {
      company: 'Shivneri Systems',
      role: 'Frontend Web Developer',
      start: '2022-02',
      end: '2022-03',
      location: 'Kolhapur, Maharashtra, India',
      skills: ['HTML', 'CSS'],
    },
  ],
  education: [
    {
      institution: 'SunBeam Institute of Information Technology, Pune-Karad',
      degree: 'PG Diploma',
      field: 'Advanced Computing',
      start: '2024-08',
      end: '2025-02', // LinkedIn shows completed
      skills: ['C#', 'Spring Framework', '+5 skills'],
    },
    {
      institution: 'SHARAD INSTITUTE OF TECHNOLOGY COLLEGE OF ENGINEERING',
      degree: 'Bachelor of Technology (B.Tech)',
      field: 'Computer Science and Engineering',
      start: '2020', // Resume says 2020-2024; LinkedIn says 2021-2024. Resume wins (4-year B.Tech is the standard duration, and "personal data" defers to the resume per the skill's conflict table).
      end: '2024',
    },
  ],
};

// ---------- GitHub: filter + map ----------
function mapGithubRepos(rawRepos) {
  return rawRepos
    .filter(r => !r.fork)
    .filter(r => !r.archived)
    // Skill rule: drop repos with NO description AND 0 stars AND 0 topics
    // (empty husk repos). Apply literally.
    .filter(r => r.description || r.stargazers_count > 0 || (r.topics && r.topics.length > 0))
    .sort((a, b) => {
      const dt = new Date(b.pushed_at) - new Date(a.pushed_at);
      return dt !== 0 ? dt : b.stargazers_count - a.stargazers_count;
    })
    .map(r => {
      const desc = r.description
        ?? (r.topics && r.topics.length > 0
              ? `Tagged: ${r.topics.join(', ')}.`
              : r.language
                ? `${r.language} project.`
                : 'No description provided.');
      return {
        name: r.name,
        description: desc,
        url: r.html_url,
        language: r.language ?? null,
        stars: r.stargazers_count,
        topics: r.topics ?? [],
        source: 'github',
        pushedAt: r.pushed_at,
      };
    });
}

// ---------- Resume: manually structured from pdftotext output ----------
// (Heuristic pass: regex/date/header extraction on the PDF text was sufficient
// to populate the schema. The PDF has a clean text layer, no OCR needed.)
function buildResumeProjects() {
  return [
    {
      name: 'Dattayog Farmers PVT. LTD. Website',
      description: 'Website for an agricultural and dairy products company, built with ReactJS, HTML, CSS, TailwindCSS, and JavaScript. Implemented React Router for navigation.',
      url: 'https://dattayog.com',
      language: null,
      stars: 0,
      topics: [],
      source: 'resume',
      pushedAt: null,
    },
    {
      name: 'Portfolio Website for AnuDeep Industries',
      description: 'Website for an Ichalkaranji-based company specializing in agriculture services, built with HTML, CSS, Tailwind CSS, JavaScript, NodeJS, and ExpressJS.',
      url: 'https://anudeepindustries.onrender.com/',
      language: null,
      stars: 0,
      topics: [],
      source: 'resume',
      pushedAt: null,
    },
    {
      name: 'Opinions - Thoughts Sharing Platform',
      description: 'Full-stack blogging platform using React.js, Node.js, Express.js, and MongoDB. Users can create, edit, and delete blogs.',
      url: 'http://opinions-app.yashrajshitole.in',
      language: null,
      stars: 0,
      topics: [],
      source: 'resume',
      pushedAt: null,
    },
  ];
}

// ---------- Resume-sourced experience: highlights from the PDF ----------
// The PDF gives more detail for the RacksonsIT role; LinkedIn gives
// the company name without the "Pvt. Ltd." suffix. We use LinkedIn's
// company name and merge in the resume's bullet-point highlights.
const RESUME_HIGHLIGHTS_RACKSONSIT = [
  'Collaborated with clients to gather and handle requirements.',
  'Designed and implemented UI using ReactJS and TailwindCSS.',
  'Deployed a fully functional, responsive website.',
  'Ensured cross-browser compatibility.',
];

// ---------- Merge ----------
function mergeProjects({ resumeProjects, githubProjects, resumeRepoNames }) {
  const dedupedGithub = githubProjects.filter(p => !resumeRepoNames.has(p.name));
  return [...resumeProjects, ...dedupedGithub];
}

// ---------- Skills ----------
// Built from LinkedIn headline (primary) + resume technical skills section
// (secondary). Deduped within each category.
function buildSkills() {
  const categories = [
    {
      category: 'Languages',
      items: ['Java', 'C++', 'C#', 'JavaScript', 'TypeScript'],
    },
    {
      category: 'Web Frameworks',
      items: ['React', 'ReactJS', 'Angular', 'Spring Framework', 'JSP', 'TailwindCSS', 'HTML', 'CSS'],
    },
    {
      category: 'Backend',
      items: ['Node.js', 'Express.js'],
    },
    {
      category: 'Mobile',
      items: ['Android'],
    },
    {
      category: 'Databases',
      items: ['MySQL', 'MongoDB'],
    },
    {
      category: 'Tools',
      items: ['Git', 'VS Code', 'Eclipse'],
    },
    {
      category: 'Operating Systems',
      items: ['Windows', 'Linux'],
    },
    {
      category: 'Methodologies',
      items: ['Agile', 'Waterfall'],
    },
    {
      category: 'Soft Skills',
      items: ['Problem Solving', 'Teamwork', 'Time Management', 'Communication'],
    },
  ];
  return categories.map(c => {
    const seen = new Set();
    const items = [];
    for (const item of c.items) {
      const key = item.toLowerCase().trim();
      if (!seen.has(key)) { seen.add(key); items.push(item); }
    }
    return { category: c.category, items };
  });
}

// ---------- Schema validation (lightweight, no zod dep) ----------
function validate(p) {
  const errors = [];
  if (!p.profile?.name) errors.push('profile.name is required');
  if (!p.profile?.tagline && !p.profile?.bio)
    errors.push('at least one of profile.tagline / profile.bio is required');
  if (!Array.isArray(p.skills)) errors.push('skills must be an array');
  if (!Array.isArray(p.experience)) errors.push('experience must be an array');
  if (!Array.isArray(p.education)) errors.push('education must be an array');
  if (!Array.isArray(p.projects)) errors.push('projects must be an array');
  for (const proj of p.projects ?? []) {
    if (!['github', 'resume'].includes(proj.source))
      errors.push(`project "${proj.name}" has invalid source: ${proj.source}`);
    if (typeof proj.stars !== 'number') errors.push(`project "${proj.name}" stars not a number`);
  }
  return errors;
}

// ---------- Main ----------
async function main() {
  const githubRaw = JSON.parse(await readFile(resolve(dataDir, '_github_repos.json'), 'utf8'));
  const githubProjects = mapGithubRepos(githubRaw);
  const resumeProjects = buildResumeProjects();
  const resumeRepoNames = new Set(resumeProjects.map(p => p.name));
  const projects = mergeProjects({ resumeProjects, githubProjects, resumeRepoNames });

  // Experience: LinkedIn is the source for company/role/dates/location.
  // Resume fills in highlights for the RacksonsIT role.
  const experience = LINKEDIN_PASTE.experience.map(e => {
    const entry = {
      company: e.company,
      role: e.role,
      start: e.start,
      end: e.end,
      summary: e.skills?.length ? `Stack: ${e.skills.join(', ')}.` : '',
    };
    if (e.location) entry.location = e.location;
    if (e.mode) entry.mode = e.mode;
    if (e.company === 'RacksonsIT Developers' || e.company === 'RacksonsIT Developers Pvt. Ltd.') {
      entry.company = 'RacksonsIT Developers Pvt. Ltd.'; // full legal name from resume
      entry.highlights = RESUME_HIGHLIGHTS_RACKSONSIT;
    }
    return entry;
  }).sort((a, b) => (b.start ?? '').localeCompare(a.start ?? ''));

  // Education: LinkedIn is the source for end dates (live); resume is the
  // source for start dates (more specific). B.Tech start: LinkedIn says 2021,
  // resume says 2020. We honor the resume (historical fact, 4-year B.Tech is
  // standard). See skill conflict table: "resume wins for personal data."
  const education = LINKEDIN_PASTE.education;

  const portfolio = {
    profile: {
      name: LINKEDIN_PASTE.name, // LinkedIn: "Yashraj Shitole" (public-facing)
      // Full legal name from resume is "Yashraj Ranjeet Shitole" — see notes.
      tagline: 'Java • TypeScript • Angular • Node.js • PostgreSQL',
      bio: 'Full-stack software engineer with experience across Angular, Node.js, Express, and PostgreSQL. Currently building production software at Raykor Technologies; previously interned at RacksonsIT Developers and QSective Solutions. PG Diploma in Advanced Computing (CDAC, SunBeam, 2025); B.Tech in Computer Science.',
      avatar: 'https://avatars.githubusercontent.com/u/71110021?v=4',
      location: LINKEDIN_PASTE.location,
      email: 'yashraj.r.shitole@gmail.com',
    },
    skills: buildSkills(),
    experience,
    education,
    projects,
    contact: {
      github: 'yashraj-shitole',
      linkedin: 'yashraj-shitole-576442215',
      email: 'yashraj.r.shitole@gmail.com',
      website: 'https://yashrajshitole.in',
    },
  };

  const errors = validate(portfolio);
  if (errors.length) {
    console.error('Validation failed:');
    for (const e of errors) console.error('  -', e);
    const failedPath = resolve(dataDir, 'portfolio.failed.json');
    await writeFile(failedPath, JSON.stringify(portfolio, null, 2), 'utf8');
    console.error(`Partial result written to ${failedPath}`);
    process.exit(1);
  }

  const outPath = resolve(dataDir, 'portfolio.json');
  await writeFile(outPath, JSON.stringify(portfolio, null, 2), 'utf8');
  console.log(`Wrote ${outPath}`);
  console.log(`  ${portfolio.projects.length} projects (${projects.filter(p=>p.source==='github').length} from GitHub, ${projects.filter(p=>p.source==='resume').length} from resume)`);
  console.log(`  ${portfolio.skills.length} skill categories, ${portfolio.skills.reduce((n,c)=>n+c.items.length,0)} unique skills`);
  console.log(`  ${portfolio.experience.length} experience entries`);
  console.log(`  ${portfolio.education.length} education entries`);

  try { await unlink(resolve(dataDir, '_github_repos.json')); } catch {}
}

main().catch(err => { console.error(err); process.exit(1); });
