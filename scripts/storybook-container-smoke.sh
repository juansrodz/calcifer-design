#!/usr/bin/env bash
# Runs the built Storybook image and checks the headers docker/storybook.nginx.conf is meant to
# set. Not part of `bun run check`, which must pass without a Docker daemon; CI runs this in the
# check job, after `bun run check` has produced packages/ui/storybook-static.
set -euo pipefail

script_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${script_directory}/.."
# shellcheck source=scripts/lib/container-smoke.sh
source "${script_directory}/lib/container-smoke.sh"

script_label="storybook-container-smoke"
image="${1:?usage: storybook-container-smoke.sh <image-tag>}"
host_port=18080
base_url="http://127.0.0.1:${host_port}"
container=""
trap cleanup EXIT INT TERM

container="$(docker run --detach --publish "127.0.0.1:${host_port}:8080" "$image")"

wait_until_ready "/storybook/"

index_headers="$(response_headers "${base_url}/storybook/")"
grep -qi '^cache-control: no-cache$' <<<"$index_headers" ||
  fail "the index should revalidate, got: $(grep -i '^cache-control' <<<"$index_headers")"

redirect_headers="$(response_headers "${base_url}/storybook")"
grep -q '^HTTP/1.1 301' <<<"$redirect_headers" || fail "/storybook should redirect to /storybook/"
grep -qi '^location: /storybook/$' <<<"$redirect_headers" ||
  fail "the redirect should be relative (absolute_redirect off)"

hashed_bundle="$(find_hashed_bundle packages/ui/storybook-static)"
[ -n "$hashed_bundle" ] || fail "no content-hashed JS bundle in packages/ui/storybook-static"

asset_headers="$(response_headers --header 'Accept-Encoding: gzip' \
  "${base_url}/storybook/${hashed_bundle}")"
grep -q '^HTTP/1.1 200' <<<"$asset_headers" || fail "${hashed_bundle} was not served"
grep -qi '^content-encoding: gzip$' <<<"$asset_headers" ||
  fail "${hashed_bundle} was not compressed"
grep -qi '^cache-control: public, max-age=31536000, immutable$' <<<"$asset_headers" ||
  fail "${hashed_bundle} is content-hashed and should be immutable"

runtime_headers="$(response_headers "${base_url}/storybook/sb-preview/runtime.js")"
grep -q '^HTTP/1.1 200' <<<"$runtime_headers" || fail "sb-preview/runtime.js was not served"
grep -qi '^cache-control: no-cache$' <<<"$runtime_headers" ||
  fail "sb-preview/runtime.js has a stable filename and must not be immutable"

echo "storybook-container-smoke: ok (${hashed_bundle} immutable and gzipped, runtime revalidating)"
