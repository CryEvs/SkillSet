import json
import os

p = os.path.expanduser("~/.skillset/skillset.json")
with open(p, "r", encoding="utf-8") as f:
    cfg = json.load(f)

cfg.setdefault("agents", {}).setdefault("defaults", {})["model"] = {
    "primary": "ollama/qwen2.5:14b-instruct"
}

cfg.setdefault("models", {}).setdefault("providers", {})["ollama"] = {
    "baseUrl": "http://172.27.80.1:11434",
    "apiKey": "ollama-local",
    "api": "ollama",
    "models": [
        {
            "id": "qwen2.5:14b-instruct",
            "name": "qwen2.5:14b-instruct",
            "reasoning": False,
            "input": ["text"],
            "cost": {"input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0},
            "contextWindow": 32768,
            "maxTokens": 8192,
        }
    ],
}

with open(p, "w", encoding="utf-8") as f:
    json.dump(cfg, f, ensure_ascii=False, indent=2)

print(p)
