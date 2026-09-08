"""Trim problem_statements.csv and seed SQL to exactly SIH26001–SIH26226, then delete extras from Supabase."""
import csv, os, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KEEP = {f'SIH26{str(i).zfill(3)}' for i in range(1, 227)}
EXTRAS = [f'SIH26{str(i).zfill(3)}' for i in range(227, 234)]

# ── 1. Rewrite CSV ────────────────────────────────────────────────────────────
with open(ROOT / 'problem_statements.csv', encoding='utf-8') as f:
    rows = [r for r in csv.DictReader(f) if r['id'] in KEEP]

with open(ROOT / 'problem_statements.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, ['id', 'title', 'category', 'organization', 'theme'])
    w.writeheader(); w.writerows(rows)

sw = sum(1 for r in rows if r['category'] == 'software')
hw = sum(1 for r in rows if r['category'] == 'hardware')
print(f'CSV: {len(rows)} rows  (software={sw}, hardware={hw})')

# ── 2. Rewrite SQL seed ───────────────────────────────────────────────────────
def esc(s): return s.replace("'", "''")

lines = ['BEGIN;\n']
for r in rows:
    lines.append(
        f"INSERT INTO problem_statements (id,title,category,organization,theme) VALUES "
        f"('{esc(r['id'])}','{esc(r['title'])}','{esc(r['category'])}','{esc(r['organization'])}','{esc(r['theme'])}')"
        f" ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, category=EXCLUDED.category,"
        f" organization=EXCLUDED.organization, theme=EXCLUDED.theme;"
    )
lines.append('\nCOMMIT;')
(ROOT / 'seed_problem_statements.sql').write_text('\n'.join(lines), encoding='utf-8')
print('SQL seed updated.')

# ── 3. Delete extras from Supabase ───────────────────────────────────────────
# Read creds from .env.local
env = {}
env_file = ROOT / '.env.local'
if env_file.exists():
    for line in env_file.read_text(encoding='utf-8').splitlines():
        if '=' in line and not line.startswith('#'):
            k, _, v = line.partition('=')
            env[k.strip()] = v.strip()

url  = env.get('VITE_SUPABASE_URL', '')
key  = env.get('SUPABASE_SERVICE_ROLE_KEY') or env.get('VITE_SUPABASE_ANON_KEY', '')

if not url or not key:
    print('No Supabase credentials — skipping remote delete.')
    print(f'Run this SQL manually:\n  DELETE FROM problem_statements WHERE id IN ({", ".join(repr(e) for e in EXTRAS)});')
    sys.exit(0)

try:
    from supabase import create_client
    sb = create_client(url, key)
    result = sb.table('problem_statements').delete().in_('id', EXTRAS).execute()
    print(f'Deleted extras from Supabase: {EXTRAS}')
except Exception as e:
    print(f'Supabase delete failed ({e}).')
    print(f'Run this SQL manually in the Supabase dashboard:')
    ids = ', '.join(f"'{x}'" for x in EXTRAS)
    print(f"  DELETE FROM problem_statements WHERE id IN ({ids});")
