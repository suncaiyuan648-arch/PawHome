from pathlib import Path
from PIL import Image, ImageDraw
import sys

reference = Image.open(sys.argv[1]).convert("RGB")
actual = Image.open(sys.argv[2]).convert("RGB")
output = Path(sys.argv[3])

height = min(reference.height, actual.height)
reference = reference.crop((0, 0, min(375, reference.width), height))
actual = actual.crop((0, 0, min(375, actual.width), height))

canvas = Image.new("RGB", (reference.width + actual.width, height + 28), "white")
canvas.paste(reference, (0, 28))
canvas.paste(actual, (reference.width, 28))
draw = ImageDraw.Draw(canvas)
draw.text((8, 7), "FIGMA", fill="#111111")
draw.text((reference.width + 8, 7), "IMPLEMENTATION", fill="#111111")
output.parent.mkdir(parents=True, exist_ok=True)
canvas.save(output)
