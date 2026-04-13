from html.parser import HTMLParser
from pathlib import Path

class E(HTMLParser):
    def __init__(self):
        super().__init__()
        self.errors=[]
    def error(self,message):
        self.errors.append(message)

text = Path(r'c:/Users/ben_s/Desktop/Pioneros_sitio/index.html').read_text(encoding='utf-8')
parser = E()
parser.feed(text)
print('errors', parser.errors[:10])
