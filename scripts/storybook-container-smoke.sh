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
# `cleanup` only removes the container; on a signal the script must also stop, which a bare
# `trap cleanup INT TERM` does not do — the handler returns and execution resumes at the next
# statement. 130 is the conventional status for a script ended by a signal.
trap cleanup EXIT
trap 'cleanup; exit 130' INT TERM

container="$(docker run --detach --publish "127.0.0.1:${host_port}:8080" "$image")"

wait_until_ready "/storybook/"

index_headers="$(response_headers "${base_url}/storybook/")"
grep -qi '^cache-control: no-cache$' <<<"$index_headers" ||
  fail "the index should revalidate, got: $(grep -i '^cache-control' <<<"$index_headers")"

assert_prefix_redirect "/storybook"

hashed_bundle="$(find_hashed_bundle packages/ui/storybook-static)"
[ -n "$hashed_bundle" ] || fail "no content-hashed JS bundle in packages/ui/storybook-static"

assert_immutable_gzipped_asset "/storybook/${hashed_bundle}"

runtime_headers="$(response_headers "${base_url}/storybook/sb-preview/runtime.js")"
grep -q '^HTTP/1.1 200' <<<"$runtime_headers" || fail "sb-preview/runtime.js was not served"
grep -qi '^cache-control: no-cache$' <<<"$runtime_headers" ||
  fail "sb-preview/runtime.js has a stable filename and must not be immutable"

echo "storybook-container-smoke: ok (${hashed_bundle} immutable and gzipped, runtime revalidating)"
