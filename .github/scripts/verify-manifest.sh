#!/usr/bin/env bash
#
# Fails unless the manifest covers every artifact a release is expected to carry, so a release whose
# matrix arm failed is not signed short. The counts follow the package workflow's matrix: change one,
# change the other.
set -euo pipefail

manifest="${1:?usage: verify-manifest.sh SHA256SUMS}"

if [ ! -r "$manifest" ]; then
    echo "no readable manifest at ${manifest}" >&2
    exit 1
fi

required=(
    '\.dmg$:2'          # macos, x64 and arm64
    '\.exe$:2'          # windows, x64 and arm64
    '\.deb$:1'          # linux x64
    '\.rpm$:1'          # linux x64
    '\.AppImage$:2'     # linux, x64 and arm64
)

short=0
for spec in "${required[@]}"; do
    pattern="${spec%:*}"
    expected="${spec##*:}"
    actual=$(grep -cE "$pattern" "$manifest") || [ $? -eq 1 ] || exit 1
    if [ "$actual" -ne "$expected" ]; then
        echo "manifest carries $actual file(s) matching ${pattern}, expected ${expected}" >&2
        short=1
    fi
done

total=$(wc -l < "$manifest")
if [ "$total" -ne 8 ]; then
    echo "manifest carries $total files, expected 8" >&2
    short=1
fi

exit "$short"
