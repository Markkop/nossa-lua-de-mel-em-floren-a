#!/usr/bin/env bash
# Lote pontual: 5 karaokês com o mesmo perfil que download_karaoke.sh (360p, MP4, karaoke/).
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${OUT_DIR:-$ROOT/karaoke}"
MAX_VIDEO_HEIGHT="${MAX_VIDEO_HEIGHT:-360}"

command -v yt-dlp &>/dev/null || { echo "Instale: brew install yt-dlp"; exit 1; }
command -v ffmpeg &>/dev/null || { echo "Instale: brew install ffmpeg"; exit 1; }

sanitize_filename() {
  printf '%s' "$1" | tr '\n\r' '  ' | sed -e 's/[\/:*?"<>|]/-/g' -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'
}

# música, artista, url
download_one() {
  local music="$1" artist="$2" url="$3"
  url="${url%%&*}"
  local base
  base="$(sanitize_filename "$artist") - $(sanitize_filename "$music")"
  echo ""
  echo ">>> $base"
  echo "    $url"
  yt-dlp --no-warnings \
    --force-overwrites \
    --merge-output-format mp4 \
    -S "vcodec:h264,res:${MAX_VIDEO_HEIGHT},acodec:aac" \
    -f "bestvideo[height<=${MAX_VIDEO_HEIGHT}][vcodec^=avc1][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${MAX_VIDEO_HEIGHT}][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4][height<=${MAX_VIDEO_HEIGHT}][vcodec^=avc1]/best[ext=mp4][height<=${MAX_VIDEO_HEIGHT}]/best" \
    --postprocessor-args "Merger+ffmpeg:-c copy -movflags +faststart" \
    -o "${OUT_DIR}/${base}.%(ext)s" \
    "$url"
}

mkdir -p "$OUT_DIR"

download_one "Pontos de Exclamação" "Vintage Culture & Jovem Dionísio" "https://youtu.be/2dZcop9rrLE"
download_one "Nova Onda do Imperador (Kuzco)" "Disney (Selma Lopes/Mariana Féo)" "https://youtu.be/xmc_9b3Ui94"
download_one "Hakuna Matata" "O Rei Leão" "https://youtu.be/5Ed0AYzX_FE"
download_one "Meu Abrigo" "Melim" "https://youtu.be/vbPzJPe1kMs"
download_one "Vejo enfim a luz brilhar" "Sylvia Salustti, Raphael Rossato" "https://youtu.be/vh2P2BGexr4"

echo ""
echo "Concluído. Pasta: $OUT_DIR"
ls -lh "$OUT_DIR"/*.mp4 2>/dev/null | tail -10 || true
