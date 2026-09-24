#!/bin/sh
set -eu

# Railway mounts persistent volumes after the image is built, so their initial
# ownership does not inherit the directory ownership established in Dockerfile.
chown node:node /app/.data

exec gosu node "$@"
