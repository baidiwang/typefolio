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
    resume: { label: 'Resume', href: '/resume.pdf' },
    email: {
      label: 'Email',
      href: 'mailto:baidiwang30@gmail.com',
      display: 'baidiwang30@gmail.com',
    },
    linkedin: { label: 'LinkedIn', href: 'https://www.linkedin.com/in/abbeywang' },
    github: { label: 'GitHub', href: 'https://github.com/baidiwang' },
  },
  /** The page ends like a letter. Placeholder copy. */
  ending: {
    closing: 'Thanks for reading all the way down. Write back anytime,',
    // TODO: becomes a handwritten SVG signature drawn with a stroke animation.
    signature: 'Baidi Wang',
    ps: 'P.S. Every sound on this page is synthesized live in your browser. Press ♪ to hear it.',
  },
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
    // Deliberately no links: title and photo aren't clickable.
    links: {},
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

/**
 * Games & XR, collapsed to one line:
 * "I also make games and XR: Desolation Wanderer is on Steam, the rest is on Medium."
 */
export const gamesNote = {
  before: 'I also make games and XR: Desolation Wanderer is on ',
  steam: { label: 'Steam', href: 'https://store.steampowered.com/app/4666960/desol/' },
  middle: ', the rest is on ',
  medium: {
    label: 'Medium',
    href: 'https://medium.com/@WangPortfolio/game-developmet-2cb0240c5d72',
  },
  after: '.',
}

/** The main link for a project: where its media and title point. */
export function primaryHref(links: ProjectLinks): string | undefined {
  return links.live ?? links.code ?? links.writeup
}
