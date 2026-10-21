from PIL import Image
S='/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/standbilder/'
def m(f,box,label):
    im=Image.open(S+f).convert('RGB'); c=im.crop(box); px=list(c.getdata())
    lum=[0.2126*r+0.7152*g+0.0722*b for r,g,b in px]; mn=[min(p) for p in px]
    print(f'{f[:8]:8} {label:22} max lum {max(lum):5.1f} maxmin {max(mn):3d}  lum>=230 {sum(l>=230 for l in lum):3d} >=240 {sum(l>=240 for l in lum):3d} >=245 {sum(l>=245 for l in lum):3d} >=250 {sum(l>=250 for l in lum):3d}  minch>=245 {sum(x>=245 for x in mn):3d}')
f='gewebe2-02-dach-faska.jpg'
m(f,(340,215,390,245),'Sichel')
m(f,(305,330,352,380),'Vergleich-Klumpen')
m(f,(345,338,372,358),'Strich')
m(f,(385,285,415,315),'Eigenraum')
m(f,(435,280,465,310),'GOLD')
m(f,(480,140,520,175),'MUSiC')
m(f,(0,0,800,600),'ganzes Bild')
f='gewebe-02-dach-faska.jpg'
m(f,(368,175,412,202),'Sichel alt')
m(f,(335,286,363,318),'Vergleich alt')
m(f,(353,274,382,296),'Balken alt')
m(f,(0,0,800,500),'ganzes Bild alt')
