#!/usr/bin/env bash
# Encode project thumbnails (GIFs from the old 3D-Portfolio repo) into
# MP4 (H.264) + WebM (VP9) + JPEG poster in public/media/.
#
# Usage: scripts/encode-media.sh <path-to-old-repo>/public/thumbnails
#
# Never ship GIFs: they are 5–30x larger than the equivalent video.
# Target: each video file under ~1.5 MB. The script prints sizes at the end.
set -euo pipefail

SRC="${1:?usage: encode-media.sh <thumbnails-dir>}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/media"
mkdir -p "$OUT"

# id | source file | trim start (s) | duration (s, empty = whole clip) | width | crf (h264) | crf (vp9)
JOBS=(
  "google-play|google.gif|0|9|480|25|34"
  "lily|lily.gif|0||720|23|32"
  "breadcrumb|breadcrumb.gif|0||720|23|32"
  "look-closer|look-closer.gif|0||720|24|33"
  "trustpath|trustPath.gif|0||720|24|33"
  "little-helper|little-helpers.gif|0||720|24|33"
  "desolation-wanderer|desol.gif|0||720|24|33"
)

for job in "${JOBS[@]}"; do
  IFS='|' read -r id file start dur width crf264 crf9 <<<"$job"
  in="$SRC/$file"
  trim=(-ss "$start")
  [[ -n "$dur" ]] && trim+=(-t "$dur")
  # Even dimensions are required by yuv420p.
  vf="fps=24,scale=${width}:-2:flags=lanczos"

  echo "→ $id"
  ffmpeg -v error -y "${trim[@]}" -i "$in" -an -vf "$vf" \
    -c:v libx264 -preset slow -crf "$crf264" -pix_fmt yuv420p \
    -movflags +faststart "$OUT/$id.mp4"
  ffmpeg -v error -y "${trim[@]}" -i "$in" -an -vf "$vf" \
    -c:v libvpx-vp9 -b:v 0 -crf "$crf9" -row-mt 1 -deadline good -cpu-used 2 \
    -pix_fmt yuv420p "$OUT/$id.webm"
  # Poster: first frame of the trimmed clip (what reduced-motion users see).
  ffmpeg -v error -y "${trim[@]}" -i "$in" -vf "scale=${width}:-2:flags=lanczos" \
    -frames:v 1 -q:v 4 "$OUT/$id.jpg"
done

echo
ls -la "$OUT"
