/** Keep the small wall plates outside the inhabited apartments and above traffic. */
export function sceneControlPlacement(
  viewWidth: number,
  world: {
    left: number
    right: number
    top: number
    height: number
  },
) {
  const leftSpace = world.left,
    rightSpace = viewWidth - world.right
  if (viewWidth <= 1000 || leftSpace < 84 || rightSpace < 84)
    return { mode: 'edge' as const, left: 0, right: 0, top: 0 }
  return {
    mode: 'walls' as const,
    left: leftSpace / 2 - 24,
    right: rightSpace / 2 - 24,
    top: Math.min(
      world.top + world.height * 0.61,
      world.top + world.height * 0.78 - 96,
    ),
  }
}
