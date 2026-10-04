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
  /** Rendered as "Role: …". Empty strings are not rendered. */
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
  stack?: string[]
  href?: string
  linkLabel?: string
}

export const site = {
  name: 'Baidi Wang',
  title: 'Design Engineer',
  /** Four lines, each on its own line, typed in order. */
  intro: [
    'Hey! I’m a Design Engineer.',
    'I build web and mobile products, lately a lot of them with AI inside.',
    'Making interactive graphics gave me a designer’s eye, and I’ve built games and XR too.',
    'Right now I’m building my own iOS app, launching on the App Store soon!',
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
    closing:
      'Either you really like typewriters, or you really liked the work. Either way, thanks for staying to the last line. If you have more to say, write me back:',
    signOff: 'Yours in type,',
    signature: 'Baidi',
  },
} as const

export const featuredProjects: Project[] = [
  {
    id: 'google-play',
    title: 'Google Play Prototypes',
    kind: 'UX Engineering · Google',
    oneLiner: 'A prototyping platform for testing new Google Play features with real users.',
    body: [
      'Our team ran a prototyping platform for Google Play. I worked with designers from different product teams, turning their Figma files into working features, motion included, that went in front of real users for testing.',
    ],
    role: 'UX Engineer (contractor), prototyping team',
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
    title: 'Lily',
    kind: 'AI Voice Assistant',
    oneLiner:
      'A voice-first sales assistant that turns a spoken conversation into notes and follow-up tasks.',
    body: [
      'Instead of a chat log, Lily shows its work as a live document: transcription streams in, and notes and tasks appear while you talk, so you can see what the agent understood in real time. Audio streams over WebRTC rather than WebSockets, which keeps the conversation feeling live.',
    ],
    role: 'Solo · design + engineering',
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
    title: 'Breadcrumb',
    kind: 'AI Desktop App',
    oneLiner:
      'A desktop companion for ADHD brains that remembers what you were thinking when your attention drifted.',
    body: [
      'I built it for myself, because I’d start one task, glance at another, and lose the first one entirely. A small toaster on your desktop drops a marker the moment you switch away, with nothing to type and without ever reading your screen. When you come back, AI rebuilds where you were and the train of thought you left behind.',
    ],
    role: 'Solo · design + engineering',
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
    title: 'Look Closer',
    kind: 'AI Hackathon · Art Viewer',
    oneLiner: 'An AI art viewer where your attention is the interface.',
    body: [
      'Built at an AI hackathon. Linger on a detail of a painting and Look Closer quietly opens the story behind it. Come back to a spot you’ve already explored and it notices, greets you, and tells you something new instead of repeating itself.',
    ],
    role: 'Solo · design + engineering',
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

/** DATA VISUALIZATION: one entry, after Selected work. */
export const otherProjects: OtherProject[] = [
  {
    id: 'data-visualization',
    title: 'Data Visualization at Axios',
    kind: 'Data Visualization Engineer · Axios',
    oneLiner:
      'Interactive D3 graphics, Datawrapper charts and Illustrator illustrations for Axios news stories. I made the calls on chart type, colour and hierarchy, working within Axios’s design system.',
    stack: ['JavaScript', 'D3.js', 'Datawrapper', 'Illustrator', 'Python (Pandas)', 'R'],
    href: 'https://medium.com/@WangPortfolio/daily-data-viz-graphics-bc698435092a',
    linkLabel: 'Writeup',
  },
]

/** GAMES & XR: full entries, after Data Visualization, before the closing. */
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
    id: 'desol',
    title: 'Desol',
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
      src: '/media/desol',
      width: 720,
      height: 398,
      alt: 'Gameplay recording of Desol crossing the desert.',
    },
  },
]

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

/** The main link for a project: where its media and title point. */
export function primaryHref(links: ProjectLinks): string | undefined {
  return links.live ?? links.code ?? links.writeup
}
