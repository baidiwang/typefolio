import {
  featuredProjects,
  gameProjects,
  otherProjects,
  site,
  xrExperiments,
} from '../content'
import type { OtherProject, Project } from '../content'
import type { Rect, RoomKind } from './rooms'
export type { Rect } from './rooms'

export const contact = {
  contactEmail: site.links.email.display,
  resumeUrl: site.links.resume.href,
  linkedinUrl: site.links.linkedin.href,
  xUrl: 'https://x.com/baidi_wang',
}
export type WindowProject = {
  id: string
  title: string
  category: string
  description: string
  caption: string
  room: string
  scene: RoomKind
  rect: Rect
  projects: Project[]
  article?: OtherProject
}
const project = (id: string) =>
  featuredProjects.find((entry) => entry.id === id)!

// Physical slots: west top→bottom, then east top→bottom. Art and actors follow scene.
export const windows: WindowProject[] = [
  {
    ...project('google-play'),
    category: 'UX Engineering · Google',
    description: project('google-play').oneLiner,
    room: 'The dinner table',
    scene: 'dining',
    caption: 'Working prototypes, tested with real users.',
    rect: { x: 152, y: 136, w: 413, h: 164 },
    projects: [project('google-play')],
  },
  {
    ...project('lily'),
    category: 'AI & Product',
    description: project('lily').oneLiner,
    room: 'The piano room',
    scene: 'piano',
    caption: 'A voice-first sales assistant.',
    rect: { x: 152, y: 325, w: 413, h: 164 },
    projects: [project('lily')],
  },
  {
    id: 'games',
    title: 'Games & XR',
    category: 'Games & Play',
    description:
      'Small worlds to get lost in. Games, puzzles, and spatial experiments.',
    room: 'The listening room',
    scene: 'music',
    caption: 'Games, puzzles, and XR experiments.',
    rect: { x: 152, y: 514, w: 413, h: 153 },
    projects: gameProjects,
  },
  {
    ...project('pocket'),
    category: 'iOS App',
    description: project('pocket').oneLiner,
    room: 'The reading sofa',
    scene: 'sofa',
    caption: 'An iOS app for your own small world.',
    rect: { x: 975, y: 136, w: 438, h: 164 },
    projects: [project('pocket')],
  },
  {
    id: 'ai-projects',
    title: 'Look Closer & Breadcrumb',
    category: 'AI Projects',
    description:
      'Two AI projects: an art viewer guided by your attention, and a desktop companion that helps you pick up a lost train of thought.',
    room: 'The quiet corner',
    scene: 'library',
    caption: 'Two AI projects for attention and memory.',
    rect: { x: 975, y: 325, w: 438, h: 164 },
    projects: [project('look-closer'), project('breadcrumb')],
  },
  {
    id: 'data-visualization',
    title: otherProjects[0].title,
    category: 'Data Visualization',
    description:
      'Interactive graphics and visual stories for the Axios newsroom.',
    room: 'The painting studio',
    scene: 'studio',
    caption: 'Interactive graphics for Axios.',
    rect: { x: 975, y: 514, w: 438, h: 153 },
    projects: [],
    article: otherProjects[0],
  },
]
export const windowOrder = [0, 3, 1, 4, 2, 5]
export { xrExperiments }
export function windowFromHash(hash: string) {
  const id = hash.replace(/^#/, '')
  return windows.find(
    (entry) => entry.id === id || entry.projects.some((item) => item.id === id),
  )
}
