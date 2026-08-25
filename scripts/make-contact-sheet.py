from pathlib import Path
from PIL import Image, ImageDraw
import math
import sys

source = Path(sys.argv[1])
output = Path(sys.argv[2])
start = int(sys.argv[3])
end = int(sys.argv[4])
columns = int(sys.argv[5]) if len(sys.argv) > 5 else 4

files = []
for index in range(start, end + 1):
    hits = sorted(source.glob(f"{index:03d}_*.png"))
    if hits:
        files.append((index, hits[0]))

thumb_width = 188
label_height = 28
thumb_height = 406
rows = math.ceil(len(files) / columns)
canvas = Image.new("RGB", (thumb_width * columns, (thumb_height + label_height) * rows), "white")
draw = ImageDraw.Draw(canvas)

for position, (index, file) in enumerate(files):
    row, column = divmod(position, columns)
    x = column * thumb_width
    y = row * (thumb_height + label_height)
    image = Image.open(file).convert("RGB")
    image.thumbnail((thumb_width, thumb_height), Image.Resampling.LANCZOS)
    canvas.paste(image, (x + (thumb_width - image.width) // 2, y + label_height))
    draw.text((x + 5, y + 7), f"{index:03d} {file.stem[4:30]}", fill="#111111")

output.parent.mkdir(parents=True, exist_ok=True)
canvas.save(output, quality=90)
