import csv, collections

with open('problem_statements.csv', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

print(f'Total rows in CSV: {len(rows)}')

# Show all entries and their numeric ID
nums = [(int(r['id'].replace('SIH26','')), r) for r in rows]
nums.sort()

# Entries above 226
high = [(n, r) for n, r in nums if n > 226]
print(f'\nEntries with ID > SIH26226 ({len(high)} rows):')
for n, r in high:
    print(f"  {r['id']} | {r['category']:8} | {r['title'][:70]}")

cats = collections.Counter(r['category'] for r in rows)
print(f'\nCategory breakdown: {dict(cats)}')

# Check for gaps (missing IDs)
all_ids = [n for n, _ in nums]
expected = list(range(1, 227))
missing = [i for i in expected if i not in all_ids]
extras_in_range = [n for n in all_ids if n <= 226 and all_ids.count(n) > 1]
print(f'\nMissing IDs in 1-226: {missing}')
