import json
import os

p = os.path.expanduser("~/.skillset/skillset.json")
with open(p, "r", encoding="utf-8") as f:
    print(json.dumps(json.load(f), ensure_ascii=False, indent=2))
