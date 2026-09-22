#!/usr/bin/env bash
# Shared helpers for the container smoke scripts: scripts/storybook-container-smoke.sh and
# scripts/design-container-smoke.sh. Sourced by both, right after each sets `set -euo pipefail`
# and before each sets its own `script_label`, `host_port`, `base_url` and `container` — a
# library, not a script to run on its own.
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  echo "usage: source this file from a *-container-smoke.sh script; it is a library, not a script to run directly" >&2
  exit 2
fi

set -euo pipefail

# Force-removes the container the caller started, ignoring errors: this runs from the
# EXIT/INT/TERM trap, where the container may already be gone, and from `fail`, where it always
# still exists. `${container:-}` so a thin script that forgot to set `container` before the trap
# fires is skipped here, not an "unbound variable" that hides whatever actually went wrong.
cleanup() {
  if [ -n "${container:-}" ]; then
    docker rm --force "$container" >/dev/null 2>&1 || true
  fi
}

# Reports a failure under the caller's own label, dumps the container's log tail for context,
# and exits. Only safe to call where `exit` reaches the whole script — never from inside a
# `$(...)` capture, where it would just end that subshell and let the script carry on.
# `${script_label:-container-smoke}` so a thin script that forgot to set `script_label` still
# gets a real, attributed error instead of `fail` dying on an unbound variable while reporting one.
fail() {
  echo "${script_label:-container-smoke}: $1" >&2
  if [ -n "${container:-}" ]; then
    docker logs "$container" 2>&1 | tail -50 >&2
  fi
  exit 1
}

# One request's response headers, with curl's CR line endings stripped so that every assertion
# the callers make can anchor its pattern on `$`.
response_headers() {
  curl --silent --show-error --dump-header - --output /dev/null "$@" | tr -d '\r'
}

# Polls "${base_url}$1" until it answers or 40 attempts (20s) pass; fails naming the path that
# never came up. Called as a plain statement (never `$(...)`), so `fail`'s `exit` here does end
# the whole script.
wait_until_ready() {
  local ready_path="$1"
  local ready=""
  local _attempt
  for _attempt in {1..40}; do
    # shellcheck disable=SC2154 # base_url is set by the script that sources this file.
    if curl --fail --silent --output /dev/null "${base_url}${ready_path}"; then
      ready=yes
      break
    fi
    sleep 0.5
  done
  [ -n "$ready" ] || fail "the container never served ${ready_path}"
}

# Asserts that the prefix without its trailing slash redirects to the slashed form, and that the
# Location it sends is relative: that is `absolute_redirect off` in the nginx config, without
# which nginx answers with the container's own hostname and port. Both images serve their build
# under a prefix, so both make this check. Called as a plain statement (never `$(...)`), so
# `fail`'s `exit` here does end the whole script.
assert_prefix_redirect() {
  local prefix="$1"
  local headers
  # shellcheck disable=SC2154 # base_url is set by the script that sources this file.
  headers="$(response_headers "${base_url}${prefix}")"
  grep -q '^HTTP/1.1 301' <<<"$headers" || fail "${prefix} should redirect to ${prefix}/"
  grep -qi "^location: ${prefix}/\$" <<<"$headers" ||
    fail "the redirect should be relative (absolute_redirect off)"
}

# Echoes the largest content-hashed *.js file directly under `$1`, or nothing if there is none.
# Largest first: the smallest content-hashed bundle can be under gzip_min_length, which would
# fail a caller's gzip assertion for the wrong reason. The trailing `|| true` matters: under
# `pipefail` a `grep` that matches nothing exits 1, which would otherwise be this whole
# subshell's exit status. The emptiness check is the caller's job, not this function's: that way
# the failure does not depend on `errexit` propagating correctly out of a `$(...)` capture, and
# the message stays beside the caller, which is what knows which directory it asked about.
find_hashed_bundle() {
  local bundle_directory="$1"
  # shellcheck disable=SC2010 # `ls -S` sorts by size; no glob or loop can do that.
  (cd "$bundle_directory" && ls -S -- *.js 2>/dev/null |
    grep -E '\.[0-9a-f]{8,}\.' | head -n 1) || true
}

# Asserts one content-hashed asset is served, compressed, and cacheable for a year — the three
# headers a filename that changes whenever its bytes do has earned. Takes the URL path under
# `base_url`; the messages name the file itself, which is what `find_hashed_bundle` returned.
# Called as a plain statement, for the same reason as the assertions above.
assert_immutable_gzipped_asset() {
  local asset_path="$1"
  local asset_name="${asset_path##*/}"
  local headers
  # shellcheck disable=SC2154 # base_url is set by the script that sources this file.
  headers="$(response_headers --header 'Accept-Encoding: gzip' "${base_url}${asset_path}")"
  grep -q '^HTTP/1.1 200' <<<"$headers" || fail "${asset_name} was not served"
  grep -qi '^content-encoding: gzip$' <<<"$headers" || fail "${asset_name} was not compressed"
  grep -qi '^cache-control: public, max-age=31536000, immutable$' <<<"$headers" ||
    fail "${asset_name} is content-hashed and should be immutable"
}
