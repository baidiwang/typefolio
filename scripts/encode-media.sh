#!/usr/bin/env bash
# Encode project clips (GIFs from the old 3D-Portfolio repo) into
# MP4 (H.264) + WebM (VP9) + JPEG poster in public/media/.
#
# Usage: scripts/encode-media.sh <path-to-old-repo>/public/thumbnails [id ...]
#
# Per-clip start, duration and poster time live in scripts/media-clips.sh.
# Pick them from the contact sheets (scripts/contact-sheets.sh). Pass ids to
# re-encode only those clips.
#
# Never ship GIFs: they are 5–30x larger than the equivalent video.
# Target: each video file under ~1.5 MB. The script prints sizes at the end.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="${1:?usage: encode-media.sh <thumbnails-dir> [id ...]}"
shift
ONLY=" $* "
OUT="${OUT:-$HERE/../public/media}"
mkdir -p "$OUT"
# shellcheck source=media-clips.sh
source "$HERE/media-clips.sh"

for clip in "${CLIPS[@]}"; do
  IFS='|' read -r id file start dur poster width crf264 crf9 <<<"$clip"
  [[ "$ONLY" != "  " && "$ONLY" != *" $id "* ]] && continue
  in="$SRC/$file"
  trim=(-ss "$start")
  [[ -n "$dur" ]] && trim+=(-t "$dur")
  poster="${poster:-$start}"
  # Even dimensions are required by yuv420p.
  vf="fps=24,scale=${width}:-2:flags=lanczos"

  echo "→ $id (start ${start}s, duration ${dur:-all}, poster ${poster}s)"
  ffmpeg -v error -y "${trim[@]}" -i "$in" -an -vf "$vf" \
    -c:v libx264 -preset slow -crf "$crf264" -pix_fmt yuv420p \
    -movflags +faststart "$OUT/$id.mp4"
  ffmpeg -v error -y "${trim[@]}" -i "$in" -an -vf "$vf" \
    -c:v libvpx-vp9 -b:v 0 -crf "$crf9" -row-mt 1 -deadline good -cpu-used 2 \
    -pix_fmt yuv420p "$OUT/$id.webm"
  # Poster: the frame at `poster` seconds in the source (what reduced-motion
  # users see, and what shows before the video loads).
  ffmpeg -v error -y -ss "$poster" -i "$in" -vf "scale=${width}:-2:flags=lanczos" \
    -frames:v 1 -q:v 4 "$OUT/$id.jpg"
done

echo
ls -la "$OUT"
