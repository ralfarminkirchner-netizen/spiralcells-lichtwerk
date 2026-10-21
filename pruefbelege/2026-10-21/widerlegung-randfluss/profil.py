import sys
from PIL import Image
S='/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/standbilder/'
for n in ['gewebe2-08-leseraum.jpg','gewebe2-10-faden-bis-in-die-passage.jpg']:
    im=Image.open(S+n).convert('L'); px=im.load()
    im.point(lambda v: min(255,int((v/255)**0.35*255))).save(n.replace('.jpg','-hell.png'))
    if '10' in n:
        # left edge of highlight block x=20..60 (no text), rows
        for y in range(95,275,4):
            row=[px[x,y] for x in range(22,40)]
            print(y, round(sum(row)/len(row),1))
