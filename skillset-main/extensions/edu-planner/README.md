# Edu Planner Extension

Расширение для SkillSet под учебный кейс WATA:

- роли: ученик/учитель/родитель;
- задания, дедлайны, статусы выполнения;
- недельный план через локальный Ollama;
- STT из аудиофайла и микрофона;
- рейтинг и баллы;
- шкала здоровья (лимит времени);
- питомец (кормление выполненными заданиями);
- лояльность и каталог наград.

## Быстрый старт

1. Убедиться, что SkillSet поднят (`pnpm gateway:watch`).
2. Запустить Ollama и скачать модель:
   - `ollama pull qwen2.5:14b-instruct`
3. (Для STT) установить Python-пакеты:
   - `pip install faster-whisper sounddevice numpy`
4. Перезапустить gateway.

## Примеры действий инструмента `edu_planner`

- `seed_demo_data`
- `create_assignment`
- `generate_week_plan`
- `transcribe_audio`
- `analyze_lecture_audio` (STT + анализ лекции + план действий)
- `transcribe_microphone`
- `submit_assignment`
- `leaderboard`
- `suggest_deadline`
- `feed_pet`
- `buy_item`

