#!/usr/bin/env bash
# Runs the bot sim in parallel, one process per (class, chunk of runs), then merges the dumps into one report.
#   scripts/simpar.sh <outdir> <runs per class> <chunk> [sim flags...]
# e.g. scripts/simpar.sh /tmp/sim-a 12 2 --seed 5 --scaling 1.5
out=$1; runs=$2; chunk=$3; shift 3
mkdir -p "$out"
classes="vanguard strider mystic reaver zealot shade"
for cls in $classes; do
  for ((from = 0; from < runs; from += chunk)); do
    n=$((runs - from < chunk ? runs - from : chunk))
    npx tsx scripts/simulate.ts --class "$cls" --runs "$n" --from "$from" --dump "$out/$cls-$from.json" "$@" > /dev/null 2> "$out/$cls-$from.err" &
  done
done
wait
npx tsx scripts/simulate.ts --class all --report "$@" --merge "$out"/*.json
