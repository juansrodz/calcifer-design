#!/usr/bin/env bash
# Runs the built Storybook image and checks the headers docker/storybook.nginx.conf is meant to
# set. Not part of `bun run check`, which must pass without a Docker daemon; CI runs this in the
# check job, after `bun run check` has produced packages/ui/storybook-static.
set -euo pipefail

image="${1:?usage: storybook-container-smoke.sh <image-tag>}"
base="http://127.0.0.1:18080"
container=""

cleanup() {
  if [ -n "$container" ]; then
    docker rm --force "$container" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

fail() {
  echo "storybook-container-smoke: $1" >&2
  exit 1
}

container="$(docker run --detach --publish 127.0.0.1:18080:8080 "$image")"

ready=""
for _attempt in $(seq 1 40); do
  if curl --fail --silent --show-error --output /dev/null "${base}/storybook/"; then
    ready=yes
    break
  fi
  sleep 0.5
done
[ -n "$ready" ] || fail "the container never served /storybook/"

index_headers="$(curl --silent --show-error --dump-header - --output /dev/null "${base}/storybook/" | tr -d '\r')"
grep -qi '^cache-control: no-cache$' <<<"$index_headers" ||
  fail "the index should revalidate, got: $(grep -i '^cache-control' <<<"$index_headers")"

redirect_headers="$(curl --silent --show-error --dump-header - --output /dev/null "${base}/storybook" | tr -d '\r')"
grep -q '^HTTP/1.1 301' <<<"$redirect_headers" || fail "/storybook should redirect to /storybook/"
grep -qi '^location: /storybook/$' <<<"$redirect_headers" ||
  fail "the redirect should be relative (absolute_redirect off)"

# Largest first, and `|| true` on the pipeline, for two separate reasons.
# Largest: the smallest content-hashed bundle in a real Storybook build is 355 bytes, under
# gzip_min_length, so picking whichever file the filesystem lists first would fail the gzip
# assertion below for the wrong reason.
# `|| true`: under `set -euo pipefail` a grep that matches nothing exits 1, which propagates as
# the pipeline's status and kills the script at this assignment — before the guard on the next
# line can print anything. The diagnostic would be dead code in exactly the case it is for.
hashed="$(cd packages/ui/storybook-static && ls -S -- *.js 2>/dev/null |
  grep -E '\.[0-9a-f]{8,}\.' | head -n 1 || true)"
[ -n "$hashed" ] || fail "no content-hashed JS bundle in packages/ui/storybook-static"

asset_headers="$(curl --silent --show-error --dump-header - --output /dev/null \
  --header 'Accept-Encoding: gzip' "${base}/storybook/${hashed}" | tr -d '\r')"
grep -q '^HTTP/1.1 200' <<<"$asset_headers" || fail "${hashed} was not served"
grep -qi '^content-encoding: gzip$' <<<"$asset_headers" || fail "${hashed} was not compressed"
grep -qi '^cache-control: public, max-age=31536000, immutable$' <<<"$asset_headers" ||
  fail "${hashed} is content-hashed and should be immutable"

runtime_headers="$(curl --silent --show-error --dump-header - --output /dev/null \
  "${base}/storybook/sb-preview/runtime.js" | tr -d '\r')"
grep -q '^HTTP/1.1 200' <<<"$runtime_headers" || fail "sb-preview/runtime.js was not served"
grep -qi '^cache-control: no-cache$' <<<"$runtime_headers" ||
  fail "sb-preview/runtime.js has a stable filename and must not be immutable"

echo "storybook-container-smoke: ok (${hashed} immutable and gzipped, runtime revalidating)"
