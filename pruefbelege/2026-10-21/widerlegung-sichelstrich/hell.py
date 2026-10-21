import sys
from PIL import Image
S='/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/standbilder/'
def m(f,box,label):
    im=Image.open(S+f).convert('RGB')
    c=im.crop(box); px=list(c.getdata()); L=[max(p) for p in px]; Lm=[sum(p)/3 for p in px]
    print(f[:12], label, box,'size',im.size,'max',max(L),'mean>=240',sum(1 for x in Lm if x>=240),'mean>=250',sum(1 for x in Lm if x>=250))
m('gewebe2-02-dach-faska.jpg',(340,220,385,240),'Sichel neu')
m('gewebe2-02-dach-faska.jpg',(310,335,350,375),'Vergleich neu')
m('gewebe2-02-dach-faska.jpg',(345,340,370,358),'Strich neu')
m('gewebe-02-dach-faska.jpg',(370,178,410,200),'Sichel alt')
m('gewebe-02-dach-faska.jpg',(335,288,362,315),'Vergleich alt')
m('gewebe-02-dach-faska.jpg',(355,276,380,294),'Balken alt')
