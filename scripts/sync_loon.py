#!/usr/bin/env python3
"""Generate / verify the Loon/ rule files from the Clash/ rule sets.

The Loon/README.md contract: every Clash/<name>.yaml payload entry becomes one
line in Loon/<name>.list, in the same order, with no policy name appended.

    '+.example.com'            -> DOMAIN-SUFFIX,example.com
    'example.com'              -> DOMAIN,example.com
    'DOMAIN-SUFFIX,example.com'-> DOMAIN-SUFFIX,example.com   (already explicit)
    'IP-CIDR,1.2.3.0/24'       -> IP-CIDR,1.2.3.0/24

Usage:
    python sync_loon.py            # write Loon/*.list from Clash/*.yaml
    python sync_loon.py --check    # exit 1 if any file is out of sync
"""
import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
POLICY = {
    "adblock": "REJECT",
    "direct": "DIRECT",
    "jp": "🇯🇵 日本专线",
    "hk": "🇭🇰 香港专线",
    "tw": "🇨🇳 台湾专线",
    "us": "🇺🇸 美国专线",
    "de": "🇩🇪 德国专线",
    "sea": "🌏 东南亚专线",
}
# Order in which the RULE-SET lines must appear in Loon's [Rule] section.
ORDER = ["adblock", "direct", "jp", "hk", "tw", "us", "de", "sea"]
EXPLICIT = ("DOMAIN,", "DOMAIN-SUFFIX,", "DOMAIN-KEYWORD,", "DOMAIN-REGEX,",
            "IP-CIDR,", "IP-CIDR6,", "SRC-IP-CIDR,", "GEOIP,", "IP-ASN,", "USER-AGENT,")


def clash_payload(path):
    """Payload entries of a classical-format mihomo rule-provider, in file order."""
    out = []
    for line in path.read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if not s.startswith("-"):
            continue
        s = s[1:].strip()
        if len(s) >= 2 and s[0] == s[-1] and s[0] in "'\"":
            s = s[1:-1]
        if s:
            out.append(s)
    return out


def to_loon(entry):
    if entry.startswith("+."):
        return "DOMAIN-SUFFIX," + entry[2:]
    for prefix in EXPLICIT:
        if entry.upper().startswith(prefix):
            return entry
    return "DOMAIN," + entry


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    problems = 0
    for name in ORDER:
        src = ROOT / "Clash" / f"{name}.yaml"
        dst = ROOT / "Loon" / f"{name}.list"
        if not src.exists():
            print(f"MISSING {src}")
            problems += 1
            continue
        want = [to_loon(e) for e in clash_payload(src)]
        have = []
        if dst.exists():
            have = [ln.strip() for ln in dst.read_text(encoding="utf-8").splitlines()
                    if ln.strip() and not ln.strip().startswith("#")]
        if have == want:
            print(f"ok       {dst.name:14} {len(want):3}")
            continue
        if args.check:
            print(f"OUT-OF-SYNC {dst.name}: file={len(have)} expected={len(want)}")
            problems += 1
            continue
        dst.write_bytes(("\r\n".join(want) + "\r\n").encode("utf-8"))
        print(f"wrote    {dst.name:14} {len(want):3}")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
