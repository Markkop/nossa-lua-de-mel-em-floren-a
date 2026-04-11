#!/usr/bin/env bash
# Download karaoke videos listed in yt.txt using yt-dlp.
# Parses guest list (columns Música, Artista, Youtube) and "Outras" section.
# Output: karaoke/<Artist> - <Music>.mp4 (deduplicated by URL; first row wins).

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
YT_FILE="${YT_FILE:-$SCRIPT_DIR/yt.txt}"
OUT_DIR="${OUT_DIR:-$SCRIPT_DIR/karaoke}"
# Max video height in pixels (smaller = smaller files). Audio stays best M4A (AAC).
# Override: MAX_VIDEO_HEIGHT=480 ./download_karaoke.sh
MAX_VIDEO_HEIGHT="${MAX_VIDEO_HEIGHT:-360}"

if ! command -v yt-dlp &>/dev/null; then
  echo "yt-dlp not found. Install with: brew install yt-dlp" >&2
  exit 1
fi

# Merging video+audio into one .mp4 requires ffmpeg. Without it, yt-dlp may leave
# video-only files like *.f399.mp4 that QuickTime may not play.
if ! command -v ffmpeg &>/dev/null; then
  echo "ffmpeg not found (required to merge video+audio). Install with: brew install ffmpeg" >&2
  exit 1
fi

if [[ ! -f "$YT_FILE" ]]; then
  echo "Missing file: $YT_FILE" >&2
  exit 1
fi

sanitize_filename() {
  printf '%s' "$1" | tr '\n\r' '  ' | sed -e 's/[\/:*?"<>|]/-/g' -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'
}

mkdir -p "$OUT_DIR"

echo "Video: up to ${MAX_VIDEO_HEIGHT}p (H.264). Audio: best M4A (AAC). Output: $OUT_DIR"
echo ""

# Emit tab-separated music, artist, url (deduped by URL; section 1 rows first)
extract_entries() {
  awk -F'\t' '
    function trim(s) {
      gsub(/^[ \t\r]+|[ \t\r]+$/, "", s)
      return s
    }
    function valid(music, artist, url,    m, a, u) {
      m = trim(music); a = trim(artist); u = trim(url)
      if (m == "" || m == "<empty>") return 0
      if (a == "" || a == "<empty>") return 0
      if (u == "" || u == "<empty>") return 0
      if (u !~ /^https?:\/\//) return 0
      return 1
    }
    NR == 1 { next }
    NR >= 2 && NR <= 95 {
      if (!valid($2, $3, $4)) next
      u = trim($4)
      if (seen[u]++) next
      print trim($2) "\t" trim($3) "\t" u
    }
    NR >= 99 {
      if (NF < 3) next
      if (!valid($1, $2, $3)) next
      u = trim($3)
      if (seen[u]++) next
      print trim($1) "\t" trim($2) "\t" u
    }
  ' "$YT_FILE"
}

count=0
ok=0
fail=0

while IFS=$'\t' read -r music artist url; do
  [[ -z "${music:-}" ]] && continue
  ((count++)) || true
  safe_artist="$(sanitize_filename "$artist")"
  safe_music="$(sanitize_filename "$music")"
  base="${safe_artist} - ${safe_music}"
  out_template="${OUT_DIR}/${base}.%(ext)s"

  echo ""
  echo "[$count] $base"
  echo "    $url"

  # Low-res H.264 + best M4A audio (AAC) for small files and QuickTime-friendly output.
  # Post-merge: faststart; stream copy (no re-encode).
  if yt-dlp \
    --no-warnings \
    --merge-output-format mp4 \
    -S "vcodec:h264,res:${MAX_VIDEO_HEIGHT},acodec:aac" \
    -f "bestvideo[height<=${MAX_VIDEO_HEIGHT}][vcodec^=avc1][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${MAX_VIDEO_HEIGHT}][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4][height<=${MAX_VIDEO_HEIGHT}][vcodec^=avc1]/best[ext=mp4][height<=${MAX_VIDEO_HEIGHT}]/best" \
    --postprocessor-args "Merger+ffmpeg:-c copy -movflags +faststart" \
    -o "$out_template" \
    "$url"; then
    ((ok++)) || true
  else
    echo "    FAILED (continuing...)" >&2
    ((fail++)) || true
  fi
done < <(extract_entries)

echo ""
echo "Done. OK: $ok  Failed: $fail  Total entries: $count"
echo "Files in: $OUT_DIR"
exit $(( fail > 0 ? 1 : 0 ))
