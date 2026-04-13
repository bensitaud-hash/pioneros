from pathlib import Path
p = Path(r'c:/Users/ben_s/Desktop/Pioneros_sitio/styles.css')
text = p.read_text()
count = 0
errors = []
line = 1
for ch in text:
    if ch == '{':
        count += 1
    elif ch == '}':
        count -= 1
    if count < 0:
        errors.append(line)
        count = 0
    if ch == '\n':
        line += 1
print('final', count)
print('errors', errors[:10])