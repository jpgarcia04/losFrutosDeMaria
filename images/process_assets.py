import os
from PIL import Image

try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    print("pillow_heif not installed, HEIC files might fail.")

from moviepy import VideoFileClip

dirs = ['images', 'images/cabania']

for directory in dirs:
    if not os.path.exists(directory):
        continue
    for entry in os.listdir(directory):
        filepath = os.path.join(directory, entry)
        if not os.path.isfile(filepath):
            continue
            
        ext = os.path.splitext(filepath)[1].lower()
        if ext in ['.jpg', '.jpeg', '.png', '.heic']:
            out_path = os.path.splitext(filepath)[0] + '.webp'
            try:
                img = Image.open(filepath)
                print(f"Converting image: {filepath} -> {out_path}")
                img.save(out_path, 'WEBP', quality=95)
            except Exception as e:
                print(f"Error converting {filepath}: {e}")
                
        elif ext in ['.mp4', '.mov']:
            out_path = os.path.splitext(filepath)[0] + '.webm'
            try:
                print(f"Converting video: {filepath} -> {out_path}")
                clip = VideoFileClip(filepath)
                clip.write_videofile(out_path, codec='libvpx')
                clip.close()
            except Exception as e:
                print(f"Error converting {filepath}: {e}")
