# Blender ohne Fenster: verkleinert ein Poly-Haven-Modell und schreibt eine GLB-Datei. Aufruf: Blender -b -P verkleinere.py -- ein.gltf aus.glb zieldreiecke
import bpy,sys
a=sys.argv[sys.argv.index('--')+1:]; ein,aus,ziel=a[0],a[1],int(a[2])
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=ein)
ms=[o for o in bpy.data.objects if o.type=='MESH']; tot=sum(len(o.data.polygons) for o in ms)
for o in ms:
    r=min(1,ziel/tot); bpy.context.view_layer.objects.active=o
    d=o.modifiers.new('d','DECIMATE'); d.ratio=r; bpy.ops.object.modifier_apply(modifier='d')
print('DREIECKE',sum(len(o.data.polygons) for o in ms))
for im in bpy.data.images:
    if max(im.size)>1024: im.scale(1024,1024)
bpy.ops.export_scene.gltf(filepath=aus,export_format='GLB',export_image_format='JPEG',export_jpeg_quality=80,export_apply=True)
