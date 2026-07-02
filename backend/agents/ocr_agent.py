import cv2
import easyocr
import pytesseract
from PIL import Image

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

easyocr_reader = easyocr.Reader(["en"], gpu=False)


def tesseract_text(image_path: str) -> str:
    try:
        img = cv2.imread(image_path)
        if img is None:
            return ""

        img = cv2.resize(img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        text = pytesseract.image_to_string(
            Image.fromarray(gray),
            config="--oem 3 --psm 6"
        )
        return text.strip()
    except Exception as e:
        print("Tesseract error:", e)
        return ""


def easyocr_text(image_path: str) -> str:
    try:
        result = easyocr_reader.readtext(image_path, detail=1, paragraph=False)

        lines = []
        for box, text, conf in result:
            if conf >= 0.25 and text.strip():
                lines.append(text.strip())

        return "\n".join(lines)
    except Exception as e:
        print("EasyOCR error:", e)
        return ""


def read_text_from_image(image_path: str) -> str:
    easy_text = easyocr_text(image_path)
    tess_text = tesseract_text(image_path)

    combined = easy_text + "\n" + tess_text

    lines = []
    for line in combined.splitlines():
        line = line.strip()
        if line and line not in lines:
            lines.append(line)

    final_text = "\n".join(lines)

    print("=" * 50)
    print("OCR OUTPUT:")
    print(final_text)
    print("=" * 50)

    return final_text if final_text else "OCR Error: No text detected"