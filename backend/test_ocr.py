from backend.agents.ocr_agent import read_text_from_image

image_path = r"backend/uploads/0a51b38b-573d-4545-9746-a3120f5b614c.png"

text = read_text_from_image(image_path)

print("=" * 60)
print(text)
print("=" * 60)