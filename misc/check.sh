#!/bin/sh

# check for libcairo2
if [ -f /usr/include/cairo/cairo.h ] || [ -f /usr/local/include/cairo/cairo.h ]; then
  echo libcairo2 dev files found.
  exit 0
else
  echo "\033[31m"libcairo2 dev files not found. Please run misc/install.sh to install the necessary packages."\033[0m" >&2
  exit 1
fi
