#!/usr/bin/env bash
# Wait for MinIO to accept credentials then create the evidence bucket.
set -euo pipefail

for _ in $(seq 1 60); do
    if /usr/local/bin/mc alias set local http://127.0.0.1:9000 "$S3_ACCESS_KEY" "$S3_SECRET_KEY" >/dev/null 2>&1; then
        break
    fi
    sleep 1
done

/usr/local/bin/mc mb --ignore-existing "local/$S3_BUCKET"
echo "minio bucket ready: $S3_BUCKET"
