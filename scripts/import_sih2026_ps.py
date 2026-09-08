#!/usr/bin/env python3
"""Minimal SIH 2026 importer: mirror CSV -> validate -> CSV + SQL seed."""
import csv, io, json, re, sys, warnings
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parent.parent
MIRROR = "https://raw.githubusercontent.com/vedantchalke36/sih-2026-problem-statements/main/data/sih2026_ps.csv"
ID_RE  = re.compile(r"^SIH26\d{3,}$")
CATS   = {"software", "hardware"}

def fetch() -> list[dict]:
    r = requests.get(MIRROR, timeout=20); r.raise_for_status()
    return [
        { "id": row["ps_number"].strip(),
          "title": row["title"].strip(),
          "category": row["category"].strip().lower(),
          "organization": row["org"].strip(),
          "theme": row["theme"].strip() }
        for row in csv.DictReader(io.StringIO(r.text))
    ]

def validate(rows):
    seen, valid, errors = set(), [], []
    for r in rows:
        bad = []
        if not ID_RE.match(r["id"]):
            bad.append(f"bad id: {r['id']!r}")
        elif int(r["id"].replace("SIH26", "")) > 226:
            bad.append("ID exceeds official count (> 226)")
            
        if not r["title"]:                   bad.append("empty title")
        if r["category"] not in CATS:        bad.append(f"bad category: {r['category']!r}")
        if not r["organization"]:            bad.append("empty org")
        if not r["theme"]:                   bad.append("empty theme")
        if r["id"] in seen:                  bad.append("duplicate")
        if bad:  errors.append({"row": r, "reason": "; ".join(bad)})
        else:    seen.add(r["id"]); valid.append(r)
    return valid, errors

def write_csv(rows):
    with open(ROOT / "problem_statements.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, ["id","title","category","organization","theme"])
        w.writeheader(); w.writerows(rows)

def write_sql(rows):
    esc = lambda s: s.replace("'","''")
    lines = ["BEGIN;\n"]
    for r in rows:
        lines.append(
            f"INSERT INTO problem_statements (id,title,category,organization,theme) "
            f"VALUES ('{esc(r['id'])}','{esc(r['title'])}','{esc(r['category'])}',"
            f"'{esc(r['organization'])}','{esc(r['theme'])}')\n"
            f"  ON CONFLICT (id) DO UPDATE SET "
            f"title=EXCLUDED.title, category=EXCLUDED.category, "
            f"organization=EXCLUDED.organization, theme=EXCLUDED.theme;"
        )
    lines.append("\nCOMMIT;")
    (ROOT / "seed_problem_statements.sql").write_text("\n".join(lines), encoding="utf-8")

def main():
    rows = fetch()
    print(f"Fetched {len(rows)} rows from mirror.")
    valid, errors = validate(rows)
    sw = sum(1 for r in valid if r["category"]=="software")
    hw = sum(1 for r in valid if r["category"]=="hardware")
    print(f"Valid: {len(valid)}  (software={sw}, hardware={hw})  |  Invalid: {len(errors)}")
    if errors:
        (ROOT / "validation_errors.log").write_text(
            "\n\n".join(f"{e['reason']}\n{json.dumps(e['row'])}" for e in errors), encoding="utf-8")
        print(f"Errors logged to validation_errors.log")
    write_csv(valid); print(f"Wrote problem_statements.csv")
    write_sql(valid); print(f"Wrote seed_problem_statements.sql")
    print("Done. Apply seed: supabase db push  (or paste SQL in Supabase dashboard)")

if __name__ == "__main__":
    main()
