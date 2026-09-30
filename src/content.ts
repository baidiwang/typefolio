/**
 * Portfolio content module — edit copy here.
 * Fields marked TODO need Baidi's confirmation before shipping publicly.
 */

export type ProjectSection = {
  id: string
  title: string
  body: string
}

export type FeaturedProject = {
  id: string
  anchor: string
  title: string
  oneLiner: string
  role: string
  mediaNote: string
  sections: ProjectSection[]
}

export type OtherProject = {
  id: string
  title: string
  oneLiner: string
  href?: string
}

export type ExperienceItem = {
  org: string
  role: string
  detail: string
}

export const site = {
  name: 'Baidi Wang',
  title: 'Design Engineer',
  positioning:
    'Building AI interfaces and interactive web products — from Figma to components to motion.',
  links: {
    resume: {
      label: 'Resume',
      href: '/resume.pdf', // TODO: replace with real resume PDF URL or path
    },
    email: {
      label: 'Email',
      href: 'mailto:TODO@example.com', // TODO: real email
      display: 'TODO@example.com',
    },
    linkedin: {
      label: 'LinkedIn',
      href: '#', // TODO: LinkedIn profile URL
    },
    github: {
      label: 'GitHub',
      href: 'https://github.com/baidiwang',
    },
  },
  signature: {
    closing: '— Baidi',
    note: 'Open to Design Engineer / UX Engineering roles. Happy to walk through any of the case studies above.',
  },
} as const

export const featuredProjects: FeaturedProject[] = [
  {
    id: 'google-play',
    anchor: 'google-play',
    title: 'Google Play UXE',
    oneLiner:
      'Public UX Engineering prototype exploring Play surfaces — interaction patterns, component polish, and motion for browsing and discovery.',
    role: 'UX Engineering · Prototype (public)',
    mediaNote: 'TODO: add screenshots / prototype embed',
    sections: [
      {
        id: 'background',
        title: 'Background',
        body: 'TODO: problem framing, users, and constraints for the Play UXE prototype. Confirm what can be shared publicly.',
      },
      {
        id: 'design',
        title: 'Design & tokens',
        body: 'TODO: design system / token decisions (spacing, type, color), Figma → component mapping.',
      },
      {
        id: 'implementation',
        title: 'Implementation',
        body: 'TODO: stack, component architecture, key interaction implementations.',
      },
      {
        id: 'motion',
        title: 'Motion',
        body: 'TODO: motion principles and signature transitions used in the prototype.',
      },
      {
        id: 'outcomes',
        title: 'Outcomes',
        body: 'TODO: learnings, feedback, and what shipped vs. explored.',
      },
    ],
  },
  {
    id: 'lily',
    anchor: 'lily',
    title: 'Lily',
    oneLiner:
      'A voice-first AI interface that makes the model’s state legible — live listening, thinking, and response cues without a chat-box metaphor.',
    role: 'AI interface design · Interaction',
    mediaNote: 'TODO: add demo video / stills of voice-state UI',
    sections: [
      {
        id: 'background',
        title: 'Background',
        body: 'Voice AI often hides system state. Lily explores how to show listening, processing, and speaking as readable UI — so users always know what the agent is doing.',
      },
      {
        id: 'design',
        title: 'Design & tokens',
        body: 'TODO: confirm visual language (radar / state rings), type scale, and motion tokens used for voice states.',
      },
      {
        id: 'implementation',
        title: 'Implementation',
        body: 'TODO: React / Web Audio / speech stack details and how state machine drives the UI.',
      },
      {
        id: 'motion',
        title: 'Motion',
        body: 'TODO: state transitions between idle → listening → thinking → speaking.',
      },
      {
        id: 'outcomes',
        title: 'Outcomes',
        body: 'TODO: usability notes and next iterations.',
      },
    ],
  },
  {
    id: 'breadcrumb',
    anchor: 'breadcrumb',
    title: 'Breadcrumb',
    oneLiner:
      'Continuity for unfinished work — preserves not just history, but intent, failures, and exactly where to continue.',
    role: 'Interaction & character design · Agent UX',
    mediaNote: 'TODO: add “Remember this” UI stills / agent flow',
    sections: [
      {
        id: 'background',
        title: 'Background',
        body: 'People abandon work mid-stream. Breadcrumb treats unfinished sessions as first-class state: return days later with partial context, and an agent reconstructs what you tried, what failed, and where to pick up.',
      },
      {
        id: 'design',
        title: 'Design & tokens',
        body: 'TODO: character (desktop-pet toaster) language, card UI, and “Remember this” interaction pattern — confirm final naming and visuals.',
      },
      {
        id: 'implementation',
        title: 'Implementation',
        body: 'TODO: agent memory model, session capture, and UI surface (desktop / web).',
      },
      {
        id: 'motion',
        title: 'Motion',
        body: 'TODO: character idle / remember / restore animations.',
      },
      {
        id: 'outcomes',
        title: 'Outcomes',
        body: 'Hackathon / prototype exploration (see Devpost). TODO: awards, demos, and follow-on work.',
      },
    ],
  },
  {
    id: 'look-closer',
    anchor: 'look-closer',
    title: 'Look Closer',
    oneLiner:
      'An AI-powered curiosity engine that notices what catches your eye and gently guides you through the hidden stories inside great masterpieces.',
    role: 'Interaction design · AI × art',
    mediaNote: 'TODO: add Last Supper demo stills / gaze UI',
    sections: [
      {
        id: 'background',
        title: 'Background',
        body: 'Museum and art apps often rely on hotspots or chat. Look Closer responds to looking itself — noticing attention and offering context without interrupting the artwork.',
      },
      {
        id: 'design',
        title: 'Design & tokens',
        body: 'TODO: attention cue UI, overlay typography over art, accessibility for motion / contrast.',
      },
      {
        id: 'implementation',
        title: 'Implementation',
        body: 'TODO: vision / attention model, content retrieval, and front-end stack.',
      },
      {
        id: 'motion',
        title: 'Motion',
        body: 'TODO: soft callouts, focus transitions, and non-intrusive reveal timing.',
      },
      {
        id: 'outcomes',
        title: 'Outcomes',
        body: 'Prototype / Devpost project. TODO: user testing notes and next steps.',
      },
    ],
  },
]

export const experience: ExperienceItem[] = [
  {
    org: 'Google',
    role: 'UX Engineering',
    detail:
      'TODO: confirm team, dates, and one-line scope (Play / related UXE work). Public prototype noted under Featured.',
  },
  {
    org: 'Axios',
    role: 'Design / Engineering',
    detail:
      'TODO: confirm title, dates, and one-line contribution (product UI, design systems, or front-end).',
  },
]

export const otherProjects: OtherProject[] = [
  {
    id: 'solo-game-desol',
    title: 'Solo game + Desol',
    oneLiner:
      'Game & XR work — exploratory 3D / spatial experiences (Unity / Three.js). TODO: split titles, trailers, and roles if they should be separate entries.',
  },
  {
    id: 'trustpath',
    title: 'TrustPath',
    oneLiner:
      'Web product exploring trust and pathfinding in interactive UI. TODO: refine one-liner to match final product pitch.',
    href: 'https://github.com/baidiwang/TrustPath',
  },
]
