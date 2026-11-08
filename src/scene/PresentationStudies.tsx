import { useEffect, useState } from 'react'
import { windows } from './projects'
import { NeighborhoodArtwork } from './RoomArtwork'
import { MetroVisit } from './MetroVisit'
import './presentation-studies.css'

export function PresentationStudies() {
  const [selected, setSelected] = useState(
    () =>
      windows.find(
        (w) => w.id === new URLSearchParams(location.search).get('project'),
      ) ?? windows[1],
  )
  useEffect(() => {
    document.title = `Night pass · ${selected.title} · Baidi Wang`
    history.replaceState(
      null,
      '',
      `?${new URLSearchParams({ study: 'pass', project: selected.id })}`,
    )
  }, [selected])
  return (
    <main className="metro-study">
      <NeighborhoodArtwork />
      <MetroVisit
        selected={selected}
        onNext={setSelected}
        onClose={() => {
          location.href = '/'
        }}
        motion={!new URLSearchParams(location.search).has('still')}
        origin={() => undefined}
      />
    </main>
  )
}
