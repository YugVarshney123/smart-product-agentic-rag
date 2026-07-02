import os
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, 'static', 'uploads')
AUDIO_DIR = os.path.join(BASE_DIR, 'static', 'audio')
DB_PATH = os.path.join(BASE_DIR, 'backend', 'db', 'inventory.db')
ALLOWED_EXTENSIONS = {'png','jpg','jpeg','webp'}
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)
