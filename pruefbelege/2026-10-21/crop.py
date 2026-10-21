from PIL import Image, ImageEnhance
S='/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/standbilder/'
im=Image.open(S+'gewebe2-13-handy-dach-faska.jpg'); im.crop((0,0,263,120)).resize((263*4,120*4),Image.LANCZOS).save('c13top.png')
im.crop((0,420,263,569)).resize((263*3,149*3),Image.LANCZOS).save('c13bot.png')
im=Image.open(S+'gewebe2-01-netz-ueberblick.jpg')
c=im.crop((0,470,800,600)).resize((1600,260),Image.LANCZOS); ImageEnhance.Brightness(c).enhance(3).save('c01bot.png')
