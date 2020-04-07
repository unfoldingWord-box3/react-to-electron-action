#!/bin/sh
SEMVER=$1
MSG=$2
EXTRA=$3

if [[ -z "$SEMVER" ]]; then
    echo No semver provided
    exit
fi

if [[ -z "$MSG" ]]; then
    echo No commit message provided
    exit
fi

if [[ ! -z "$EXTRA" ]]; then
    echo Extra args provided
    exit
fi

ncc build index.js

git commit -a -m "$2"
git tag $1
git push && git push --tags
