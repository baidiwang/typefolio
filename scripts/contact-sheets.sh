#!/usr/bin/env bash
# One contact sheet per clip: a frame every 0.5 s of the SOURCE file, each
# labelled with its timestamp. Use them to choose start / duration / poster
# in scripts/media-clips.sh.
#
# Usage: scripts/contact-sheets.sh <path-to-old-repo>/public/thumbnails
# Output: docs/contact-sheets/<id>.jpg
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="${1:?usage: contact-sheets.sh <thumbnails-dir>}"
OUT="$HERE/../docs/contact-sheets"
mkdir -p "$OUT"
# shellcheck source=media-clips.sh
source "$HERE/media-clips.sh"

COLS=6
for clip in "${CLIPS[@]}"; do
  IFS='|' read -r id file _ <<<"$clip"
  in="$SRC/$file"
  duration=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")
  frames=$(awk -v d="$duration" 'BEGIN { print int(d * 2) + 1 }')
  rows=$(( (frames + COLS - 1) / COLS ))
  # Portrait clips get narrower cells.
  height=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$in")
  width=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$in")
  cell=$(( height > width ? 160 : 300 ))

  echo "→ $id: ${duration}s, $frames frames"
  ffmpeg -v error -y -i "$in" -vf "\
fps=2:round=down:eof_action=pass,\
scale=${cell}:-2:flags=lanczos,\
pad=iw:ih+22:0:22:color=0x1d1b18,\
drawtext=font=monospace:fontsize=15:fontcolor=white:x=6:y=4:text='%{pts\:hms}',\
tile=${COLS}x${rows}:padding=4:margin=4:color=0x1d1b18" \
    -frames:v 1 -q:v 5 "$OUT/$id.jpg"
done

ls -la "$OUT"
