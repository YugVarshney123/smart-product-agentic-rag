import os, uuid
from gtts import gTTS
from backend.config import AUDIO_DIR


def create_voice_file(text: str):
    filename = f"voice_{uuid.uuid4().hex}.mp3"
    path = os.path.join(AUDIO_DIR, filename)
    try:
        gTTS(text=text, lang='en').save(path)
        return '/static/audio/' + filename
    except Exception:
        return None
