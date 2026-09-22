#!/usr/bin/env bash
# Runs the built docs image and checks the headers docker/design.nginx.conf is meant to set.
# Not part of `bun run check`, which must pass without a Docker daemon; CI runs it in the check
# job, after `bun run build:docs` has produced apps/docs/dist.
set -euo pipefail

script_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${script_directory}/.."
# shellcheck source=scripts/lib/container-smoke.sh
source "${script_directory}/lib/container-smoke.sh"

script_label="design-container-smoke"
image="${1:?usage: design-container-smoke.sh <image-tag>}"
host_port=18081
base_url="http://127.0.0.1:${host_port}"
container=""
# `cleanup` only removes the container; on a signal the script must also stop, which a bare
# `trap cleanup INT TERM` does not do — the handler returns and execution resumes at the next
# statement. 130 is the conventional status for a script ended by a signal.
trap cleanup EXIT
trap 'cleanup; exit 130' INT TERM

container="$(docker run --detach --publish "127.0.0.1:${host_port}:8080" "$image")"

wait_until_ready "/design/"

index_headers="$(response_headers "${base_url}/design/")"
grep -qi '^cache-control: no-cache$' <<<"$index_headers" ||
  fail "the index should revalidate, got: $(grep -i '^cache-control' <<<"$index_headers")"

assert_prefix_redirect "/design"

# The one file the shell fetches by name. It must be served, and it must never be pinned: a
# stale manifest points the shell at chunk filenames this build no longer contains.
manifest_headers="$(response_headers "${base_url}/design/mf-manifest.json")"
grep -q '^HTTP/1.1 200' <<<"$manifest_headers" || fail "mf-manifest.json was not served"
grep -qi '^cache-control: no-cache$' <<<"$manifest_headers" ||
  fail "mf-manifest.json must revalidate, got: $(grep -i '^cache-control' <<<"$manifest_headers")"

# Same policy, same reason: the portfolio's cards read this for the version and commit they
# display, and a cached copy would go on showing a build the image has already moved past.
build_info_headers="$(response_headers "${base_url}/design/build-info.json")"
grep -q '^HTTP/1.1 200' <<<"$build_info_headers" || fail "build-info.json was not served"
grep -qi '^cache-control: no-cache$' <<<"$build_info_headers" ||
  fail "build-info.json must revalidate, got: $(grep -i '^cache-control' <<<"$build_info_headers")"

hashed_bundle="$(find_hashed_bundle apps/docs/dist/static/js)"
[ -n "$hashed_bundle" ] || fail "no content-hashed JS bundle in apps/docs/dist/static/js"

assert_immutable_gzipped_asset "/design/static/js/${hashed_bundle}"

echo "design-container-smoke: ok (${hashed_bundle} immutable and gzipped, manifest and build stamp revalidating)"
