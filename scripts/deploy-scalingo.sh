#!/usr/bin/env bash
set -euo pipefail

: "${SCALINGO_TOKEN:?SCALINGO_TOKEN is required}"
: "${SCALINGO_APP:?SCALINGO_APP is required}"
SCALINGO_API_URL="${SCALINGO_API_URL:-api.osc-fr1.scalingo.com}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
ARCHIVE="$TMP_DIR/source.tar.gz"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

json_get() {
  node -e "let data='';process.stdin.on('data',c=>data+=c);process.stdin.on('end',()=>process.stdout.write(JSON.parse(data)$1));"
}

bearer_token="$(
  curl -fsS \
    -H 'Accept: application/json' \
    -H 'Content-Type: application/json' \
    -u ":${SCALINGO_TOKEN}" \
    -X POST https://auth.scalingo.com/v1/tokens/exchange \
    | json_get '.token'
)"

api() {
  local response http_code body
  response="$(curl -sS \
    -H 'Accept: application/json' \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer ${bearer_token}" \
    -w '\n%{http_code}' \
    "$@")"
  http_code="${response##*$'\n'}"
  body="${response%$'\n'*}"
  if [[ "$http_code" -lt 200 || "$http_code" -ge 300 ]]; then
    printf 'Scalingo API error (%s): %s\n' "$http_code" "$body" >&2
    return 1
  fi
  printf '%s' "$body"
}

if ! api "https://${SCALINGO_API_URL}/v1/apps/${SCALINGO_APP}" >/dev/null 2>&1; then
  echo "Creating Scalingo app ${SCALINGO_APP}..."
  api -X POST "https://${SCALINGO_API_URL}/v1/apps" \
    -d "{\"app\":{\"name\":\"${SCALINGO_APP}\"}}" >/dev/null
fi

app_url="$(api "https://${SCALINGO_API_URL}/v1/apps/${SCALINGO_APP}" | json_get '.app.url')"

git_ref="$(git -C "$ROOT_DIR" rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)"
mkdir -p "$TMP_DIR/source"
git -C "$ROOT_DIR" archive --format=tar HEAD | tar -x -C "$TMP_DIR/source"
tar -C "$TMP_DIR" -czf "$ARCHIVE" source

source_json="$(api -X POST "https://${SCALINGO_API_URL}/v1/sources")"
upload_url="$(printf '%s' "$source_json" | json_get '.source.upload_url')"
download_url="$(printf '%s' "$source_json" | json_get '.source.download_url')"

curl -fsS -L -H 'Content-Type: application/x-gzip' -X PUT --upload-file "$ARCHIVE" "$upload_url" >/dev/null

deployment_json="$(api -X POST "https://${SCALINGO_API_URL}/v1/apps/${SCALINGO_APP}/deployments" \
  -d "{\"deployment\":{\"git_ref\":\"${git_ref}\",\"source_url\":\"${download_url}\"}}")"

deployment_id="$(printf '%s' "$deployment_json" | json_get '.deployment.id')"
echo "Deployment started: ${deployment_id}"
echo "Application URL: ${app_url}"
