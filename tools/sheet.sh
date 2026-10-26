#!/bin/sh
# usage: sheet.sh clip.mp4 out.png  -> 8-frame contact sheet
ffmpeg -v error -y -i "$1" -vf "select='not(mod(n\,11))',scale=400:-1,tile=4x2" -frames:v 1 "$2"
