#!/bin/sh
if [ "$1x" == "x" ]; then
    echo No semver provided
    exit
fi
if [ "$2x" == "x" ]; then
    echo No commit message provided
    exit
fi
if [ "$3x" != "x" ]; then
    echo Extra args provided
    exit
fi

ncc build index.js

git commit -a -m "$2"
git tag $1
git push && git push --tags