/**
 * Portfolio content — edit copy here.
 *
 * Copy is Baidi's own (final copy, October 2026); links and media come
 * from the old site (github.com/baidiwang/3D-Portfolio). Do not add facts
 * that aren't there. Anything marked TODO needs Baidi's input.
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
  /** Base path without extension: `${src}.mp4`, `${src}.webm`, `${src}.jpg`
   *  for a recording, `${src}.webp` for a still. */
  src: string
  width: number
  height: number
  alt: string
  /** A still image (`${src}.webp`), not a screen recording. */
  still?: boolean
}

export type Project = {
  /** Used as the deep-link anchor: /#lily */
  id: string
  title: string
  /** Project type, from the old site's `category` field(s). Omitted: no
   *  type line. */
  kind?: string
  oneLiner: string
  /** Extra paragraphs merged in from other old categories. */
  body?: string[]
  /** Rendered as "Role: …". Omitted or empty: no role line. */
  role?: string
  /** Technologies and tools only. Skill tags (e.g. "Interaction Design")
   *  don't go here. Omitted: no stack line (the games share one line under
   *  their section label instead). */
  stack?: string[]
  links: ProjectLinks
  media: ProjectMedia
  /** One sentence about a key decision, rendered in red ink. */
  decision?: string
  /** A key phrase from `oneLiner` or `body`, swiped with the highlighter
   *  once it has typed. */
  highlight?: string
}

export const site = {
  name: 'Baidi Wang',
  /** In the page title and meta tags (index.html), not on the page. */
  title: 'Design Engineer',
  /** Four lines, each on its own line, typed in order. */
  intro: [
    'Hey! I’m a Design Engineer.',
    'I build web and mobile products, lately a lot of them with AI inside.',
    'Making interactive graphics gave me a designer’s eye, and I’ve built games and XR too.',
    'Right now I’m building Pocket, my own iOS app, launching on the App Store soon!',
  ],
  links: {
    resume: { label: 'Resume', href: '/BaidiWangResume.pdf' },
    email: {
      label: 'Email',
      href: 'mailto:baidiwang30@gmail.com',
      display: 'baidiwang30@gmail.com',
    },
    linkedin: { label: 'LinkedIn', href: 'https://www.linkedin.com/in/abbeywang' },
    github: { label: 'GitHub', href: 'https://github.com/baidiwang' },
  },
  /** The page ends like a letter: the closing (ending in the email
   *  address, linked), the sign-off, then the signature, in the same
   *  lettering as the name at the top. */
  ending: {
    closing: 'If you’ve read this far, we should probably talk. Write me back:',
    signOff: 'Yours in type,',
    signature: 'Baidi',
  },
} as const

export const featuredProjects: Project[] = [
  {
    id: 'google-play',
    title: 'Google Play Prototypes',
    kind: 'UX Engineering · Google',
    oneLiner: 'Interactive Google Play prototypes for testing new features with real users.',
    body: [
      'I partnered with designers across Google Ads, Google Japan and other product teams, turning complex Figma designs into high-fidelity prototypes in React, motion included. I also built shared MUI components and wired in Firebase, so UX researchers could validate designs with real interaction data.',
    ],
    highlight: 'Figma designs into high-fidelity prototypes',
    stack: ['React', 'Redux', 'TypeScript', 'MUI', 'Framer Motion', 'Figma'],
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
    highlight: 'shows its work as a live document',
    title: 'Lily',
    kind: 'AI Voice Assistant',
    oneLiner: 'A voice-first AI agent that turns a sales call into notes and follow-up tasks.',
    body: [
      'Instead of a chat log, Lily shows its work as a live document: as you talk, tool calls capture notes and create tasks on the page. Audio streams over WebRTC, so the conversation feels live.',
    ],
    stack: [
      'Next.js',
      'React',
      'TypeScript',
      'Tailwind CSS',
      'shadcn/ui',
      'OpenAI Realtime API',
      'WebRTC',
    ],
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
    highlight: 'the train of thought you left behind',
    title: 'Breadcrumb',
    kind: 'AI Desktop App',
    oneLiner:
      'A desktop companion that remembers what you were thinking when your attention drifts.',
    body: [
      'A small toaster on your desktop drops a marker the moment you switch away, without ever reading your screen. When you come back, AI rebuilds where you were and the train of thought you left behind. I later gave it a long-term memory with vector search for the CockroachDB × AWS hackathon.',
    ],
    stack: [
      'Tauri (Rust)',
      'React',
      'TypeScript',
      'Vite',
      'Tailwind CSS',
      'IndexedDB',
      'Claude API',
    ],
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
    highlight: 'your attention is the interface',
    title: 'Look Closer',
    kind: 'AI Hackathon · Art Viewer',
    oneLiner: 'An AI art viewer where your attention is the interface.',
    body: [
      'Built at an AI hackathon. Linger on a detail of a painting and it opens the story behind it; come back to a spot you’ve already explored and it tells you something new.',
    ],
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'OpenAI API'],
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
]

/** DATA VISUALIZATION: one entry (a full project, photo included), after
 *  Products. */
export const dataVizProjects: Project[] = [
  {
    id: 'data-visualization',
    highlight: 'I made the calls on chart type, color and hierarchy',
    title: 'Axios',
    oneLiner:
      'Interactive graphics and charts for Axios news stories, built with D3, Datawrapper and Illustrator.',
    body: [
      'I made the calls on chart type, color and hierarchy, working within Axios’s design system.',
    ],
    links: {
      writeup: 'https://medium.com/@WangPortfolio/daily-data-viz-graphics-bc698435092a',
    },
    // One of the maps, from the old site's thumbnail (its bottom fade
    // cropped off).
    media: {
      src: '/media/axios-map',
      width: 720,
      height: 606,
      alt: 'Map of the percentage change in population of U.S. cities with more than 50,000 people, July 2020 to July 2021.',
      still: true,
    },
  },
]

/** GAMES & XR: full entries, after Data Visualization, before the closing.
 *  Their shared stack is one line under the section label (`gamesStack`). */
export const gameProjects: Project[] = [
  {
    id: 'little-helper',
    title: 'Little Helper',
    kind: 'Narrative Puzzle Game',
    oneLiner:
      'A narrative puzzle game where you play a spirit, possessing objects around a little girl to guide her without her knowing.',
    role: 'Game design · gameplay engineer',
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
    id: 'desol',
    highlight: 'Released on Steam',
    title: 'Desol',
    kind: '3D Exploration Game',
    oneLiner:
      'A third-person desert exploration game with no map: you find your way by reading the landscape. Released on Steam.',
    role: 'Gameplay engineer',
    links: {
      live: 'https://store.steampowered.com/app/4666960/desol/',
      liveLabel: 'Steam',
    },
    media: {
      src: '/media/desol',
      width: 720,
      height: 398,
      alt: 'Gameplay recording of Desol crossing the desert.',
    },
  },
]

/** Under the "Games & XR" label, in place of a stack line per game. */
export const gamesStack = 'Unity · C#'

/** One line under the games: "More XR experiments: A ↗ · B ↗". */
export const xrExperiments = {
  label: 'More XR experiments:',
  links: [
    {
      title: 'Mixed Reality Cooking',
      href: 'https://horizon.meta.com/shares/razQmQWo0sTLh5O2I6TLr9u0vKvz7Y',
    },
    { title: 'Spatial Jam', href: 'https://devpost.com/software/async-jam' },
  ],
}

/** How many links a project has. With only one, its title carries it and
 *  there's no separate link line. */
export function linkCount(links: ProjectLinks): number {
  return [links.live, links.code, links.writeup].filter(Boolean).length
}

/** The main link for a project: where its media and title point. */
export function primaryHref(links: ProjectLinks): string | undefined {
  return links.live ?? links.code ?? links.writeup
}
