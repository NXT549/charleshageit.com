#!/usr/bin/env python3
"""Turn Stock Review's ASCII stills into src/ascii/stock-review.json, the sketchbook's market scenes.

    cd ../stock-review
    PYTHONIOENCODING=ascii python3 src/stock_analyzer/review/ascii_art.py --stills > /tmp/stills.txt
    cd ../charleshageit.com
    python3 showcase/make-scenes.py /tmp/stills.txt

Candles keeps all 12 of its frames (the home page animates it), every other scene keeps four, and each
scene is padded to one height so its box never jumps. The block characters become plain ASCII, and the
sample market label and tickers become neutral placeholders of the same width: the site never says where
the sample data comes from (see CLAUDE.md, rule 1).
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src", "ascii", "stock-review.json")

# The sample data says where it comes from: the market label on the monitor, the exchange suffix on some
# tickers, and bare tickers of companies listed on one exchange. Each distinct symbol (by its root, so
# "CBA" and "CBA.AX" match) becomes a neutral placeholder of the same width, in the order it first appears.
LABEL = re.compile(r"LIVE FEED  \.  [A-Z]{3}")
TICKER = re.compile(r"\b[A-Z]{2,4}\.[A-Z]{2}\b|\b(?:BHP|CBA|CSL|FMG|NAB|QAN|RIO|WES|WOW)\b")
PLACEHOLDERS = ["KIT", "FEN", "JAY", "OPA", "ZEN", "YEW", "PIX", "NUB", "GEM", "JOT"]
SWAP = [("█", "#"), ("▒", "%"), ("▲", "^")]
HEADER = re.compile(r"^(.+?)\s+\((\d+) frames\)$")
FRAME = re.compile(r"^--- frame \d+ ---$")
RULE = re.compile(r"^=+$")


def plain(line, names):
    for key, value in SWAP:
        line = line.replace(key, value)
    line = LABEL.sub("LIVE FEED  .  MKT", line)

    def placeholder(match):
        token = match.group(0)
        root = token.split(".")[0]
        if root not in names:
            names[root] = PLACEHOLDERS[len(names) % len(PLACEHOLDERS)]
        return names[root].ljust(len(token))

    return TICKER.sub(placeholder, line)


def read_scenes(path):
    scenes, frames, names = [], None, {}
    with open(path, encoding="utf-8") as fh:
        for raw in fh:
            line = raw.rstrip("\n")
            header = HEADER.match(line)
            if header:
                frames = None
                scenes.append({"title": header.group(1).strip(), "frames": []})
                continue
            if not scenes or RULE.match(line):
                continue
            if FRAME.match(line):
                frames = []
                scenes[-1]["frames"].append(frames)
            elif frames is not None:
                frames.append(plain(line.rstrip(), names))
    return scenes


def build(scenes):
    out = []
    for scene in scenes:
        keep = range(len(scene["frames"])) if scene["title"] == "Candles" else [0, 3, 6, 9]
        frames = [scene["frames"][i] for i in keep]
        height = max(len(f) for f in frames)
        frames = [f + [""] * (height - len(f)) for f in frames]
        while all(f and f[-1] == "" for f in frames):
            frames = [f[:-1] for f in frames]
        while all(f and f[0] == "" for f in frames):
            frames = [f[1:] for f in frames]
        out.append({
            "id": re.sub(r"[^a-z0-9]+", "-", scene["title"].lower()).strip("-"),
            "title": scene["title"],
            "frames": ["\n".join(f) for f in frames],
        })
    return {"source": "NXT549/stock-review", "scenes": out}


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    data = build(read_scenes(sys.argv[1]))
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    print(f"wrote {len(data['scenes'])} scenes to {OUT}")


if __name__ == "__main__":
    main()
