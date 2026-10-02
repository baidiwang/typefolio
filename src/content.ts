/**
 * Portfolio content — edit copy here.
 *
 * Source of truth: the old site's src/constants/categories.js
 * (github.com/baidiwang/3D-Portfolio). Projects that appeared in several old
 * categories are merged into one entry. Do not add facts that aren't there.
 * Anything marked TODO needs Baidi's input before it ships.
 */

export type ProjectLinks = {
  /** Live site, store page, or demo. */
  live?: string
  /** Label for the live link when "Live" is wrong (e.g. "Steam"). */
  liveLabel?: string
  code?: string
  writeup?: string
}

export type ProjectMedia = {
  /** Base path without extension: `${src}.mp4`, `${src}.webm`, `${src}.jpg`. */
  src: string
  width: number
  height: number
  alt: string
}

export type Project = {
  /** Used as the deep-link anchor: /#lily */
  id: string
  title: string
  /** Project type, from the old site's `category` field(s). */
  kind: string
  oneLiner: string
  /** Extra paragraphs merged in from other old categories. */
  body?: string[]
  /** TODO: the old site has no roles. Empty strings are not rendered. */
  role: string
  /** Technologies and tools only. Skill tags (e.g. "Interaction Design") don't go here. */
  stack: string[]
  links: ProjectLinks
  media: ProjectMedia
  /** One sentence about a key decision, rendered in red ink. */
  decision?: string
}

export type OtherProject = {
  id: string
  title: string
  kind: string
  oneLiner: string
  href?: string
  linkLabel?: string
}

export type ExperienceItem = {
  org: string
  role: string
}

export const site = {
  name: 'Baidi Wang',
  title: 'Design Engineer',
  // From the old site's About Me (src/components/HomeInfo.jsx).
  intro:
    'I’m a Design Engineer building AI interfaces and interactive web products.',
  links: {
    resume: { label: 'Resume', href: '/resume.pdf' }, // TODO: add public/resume.pdf
    // TODO: real email address.
    email: { label: 'Email', href: 'mailto:TODO@example.com', display: 'TODO@example.com' },
    linkedin: { label: 'LinkedIn', href: 'https://www.linkedin.com/in/abbeywang' },
    github: { label: 'GitHub', href: 'https://github.com/baidiwang' },
  },
  signature: '— Baidi Wang',
} as const

export const experience: ExperienceItem[] = [
  { org: 'Google', role: 'UX Engineering contractor' },
  { org: 'Axios', role: 'Data Visualization Engineer' },
]

export const featuredProjects: Project[] = [
  {
    id: 'google-play',
    title: 'Google Play Prototypes',
    kind: 'UX Engineering',
    oneLiner:
      'Interactive prototypes turning Figma designs into production-ready React components to validate new features with real users.',
    role: '', // TODO
    stack: ['React', 'TypeScript', 'Redux', 'MUI', 'Framer Motion'],
    // No live site or code on the old site: media and title link to the writeup.
    links: {
      writeup:
        'https://medium.com/@WangPortfolio/web-and-mobile-projects-5922cfb86b60',
    },
    media: {
      src: '/media/google-play',
      width: 480,
      height: 1076,
      alt: 'Screen recording of a Google Play prototype switching between tabs.',
    },
  },
  {
    id: 'lily',
    title: 'Lily',
    kind: 'AI Voice Assistant · AI Interface Design',
    oneLiner:
      'A voice-first sales assistant that captures post-call notes and creates follow-up tasks through natural conversation.',
    body: [
      'Designing a voice-first interface that makes the AI’s state legible — showing live transcription and captured tasks so users can see the AI working in real time.',
    ],
    role: '', // TODO
    stack: ['Next.js', 'TypeScript', 'OpenAI Realtime API', 'WebRTC', 'Figma'],
    links: {
      live: 'https://voice-first-chat.vercel.app/',
      code: 'https://github.com/baidiwang/voice-first-chat',
    },
    media: {
      src: '/media/lily',
      width: 720,
      height: 386,
      alt: 'Screen recording of Lily transcribing a call and listing captured tasks.',
    },
  },
  {
    id: 'breadcrumb',
    title: 'Breadcrumb',
    kind: 'AI Desktop App · Interaction & Character Design',
    oneLiner:
      'A desktop-pet working-memory companion for ADHD brains — a little toaster that drops a marker when your attention drifts, then rebuilds “where was I?” with AI when you return.',
    body: [
      'Designing the desktop-pet toaster’s character and interaction language — its states, marker gestures, and the gentle “you were here” reveal — plus the information hierarchy that turns a scattered attention trail back into a clear “where was I” picture.',
    ],
    role: '', // TODO
    stack: ['Tauri', 'Rust', 'React', 'TypeScript', 'Claude API', 'Lovable', 'Claude Design'],
    // TODO: no live link on the old site.
    links: { code: 'https://github.com/baidiwang/breadcrumb' },
    media: {
      src: '/media/breadcrumb',
      width: 720,
      height: 468,
      alt: 'Screen recording of Breadcrumb running on a desktop.',
    },
  },
  {
    id: 'look-closer',
    title: 'Look Closer',
    kind: 'AI Interface · Interaction Design',
    oneLiner:
      'An artwork viewer where attention is the interface — it senses where your gaze lingers on a painting and quietly opens the story behind that detail.',
    body: [
      'Designing an interface that responds to looking itself — no hotspots, no chat box, no markers competing with the painting. Attention becomes the only input.',
    ],
    role: '', // TODO
    stack: ['Next.js', 'TypeScript', 'OpenAI API'],
    links: {
      live: 'https://look-closer-masterpiece.vercel.app/',
      code: 'https://github.com/baidiwang/LookCloser',
    },
    media: {
      src: '/media/look-closer',
      width: 720,
      height: 330,
      alt: 'Screen recording of Look Closer opening a story on The Last Supper.',
    },
  },
  {
    id: 'trustpath',
    title: 'TrustPath',
    kind: 'AI Interface',
    oneLiner:
      'A renter-controlled document copilot that shows its evidence — every extracted field comes with source quotes and confidence, and stays fully editable by the user.',
    role: '', // TODO
    stack: ['OpenAI API', 'Serverless', 'JavaScript'],
    links: {
      live: 'https://trust-path-copilot.vercel.app/',
      code: 'https://github.com/baidiwang/TrustPath',
    },
    media: {
      src: '/media/trustpath',
      width: 720,
      height: 352,
      alt: 'Screen recording of TrustPath reviewing an uploaded document.',
    },
  },
]

export const otherProjects: OtherProject[] = [
  {
    id: 'data-visualization',
    title: 'Data Visualization',
    kind: 'Information Design',
    oneLiner:
      'Interactive editorial data visualizations — making complex datasets clear and explorable through considered chart design, color, and information hierarchy.',
    href: 'https://medium.com/@WangPortfolio/daily-data-viz-graphics-bc698435092a',
    linkLabel: 'Writeup',
  },
]

export const gameProjects: Project[] = [
  {
    id: 'little-helper',
    title: 'Little Helper',
    kind: 'Narrative Puzzle Game',
    oneLiner:
      'A narrative puzzle game where you play a spirit, possessing environmental objects to indirectly guide a little girl through space.',
    role: '', // TODO
    stack: ['Unity', 'C#'],
    // TODO: the old "Details" link (baidiwang.github.io/memory-system/) was
    // removed because it doesn't match this project.
    links: {
      writeup: 'https://medium.com/@WangPortfolio/game-developmet-2cb0240c5d72',
    },
    media: {
      src: '/media/little-helper',
      width: 720,
      height: 382,
      alt: 'Gameplay recording of Little Helper.',
    },
  },
  {
    id: 'desolation-wanderer',
    title: 'Desolation Wanderer',
    kind: '3D Exploration Game',
    oneLiner:
      'A third-person desert exploration game where uncertainty is the core mechanic — navigate without a map using environmental wayfinding. Released on Steam.',
    role: '', // TODO
    stack: ['Unity', 'C#', 'ScriptableObject'],
    links: {
      live: 'https://store.steampowered.com/app/4666960/desol/',
      liveLabel: 'Steam',
    },
    media: {
      src: '/media/desolation-wanderer',
      width: 720,
      height: 398,
      alt: 'Gameplay recording of Desolation Wanderer crossing the desert.',
    },
  },
]

export const xrProjects: OtherProject[] = [
  {
    id: 'mixed-reality-cooking',
    title: 'Mixed Reality Cooking',
    kind: 'Mixed Reality',
    oneLiner:
      'An MR cooking experience with spatially-anchored interaction, hand-based input, and a data-driven recipe system — built on a modular architecture.',
    href: 'https://horizon.meta.com/shares/razQmQWo0sTLh5O2I6TLr9u0vKvz7Y',
    linkLabel: 'Demo',
  },
  {
    id: 'spatial-jam',
    title: 'Spatial Jam',
    kind: 'XR Hackathon',
    oneLiner:
      'A collaborative real-time music experience on Snap Spectacles — create and share music spatially across locations.',
    href: 'https://devpost.com/software/async-jam',
    linkLabel: 'Devpost',
  },
]

/** The main link for a project: where its media and title point. */
export function primaryHref(links: ProjectLinks): string | undefined {
  return links.live ?? links.code ?? links.writeup
}
