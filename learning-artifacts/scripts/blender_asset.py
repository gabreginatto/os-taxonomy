"""Run with blender --background --factory-startup --python this_file -- ..."""
import argparse
import json
from pathlib import Path
import sys
import bpy
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
p=argparse.ArgumentParser()
p.add_argument('--out',required=True)
p.add_argument('--kind',choices=['cube','sphere','drum'],default='cube')
a=p.parse_args(args)
out=Path(a.out)
if out.exists(): raise RuntimeError('Refusing to overwrite an existing asset')
out.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
if a.kind=='cube': bpy.ops.mesh.primitive_cube_add(size=1.6)
elif a.kind=='sphere': bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,radius=1)
else: bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=1,depth=1.2)
obj=bpy.context.object
obj.name='Lesson_'+a.kind
mat=bpy.data.materials.new('Warm_classroom_material')
mat.diffuse_color=(0.07,0.5,0.48,1)
obj.data.materials.append(mat)
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',export_draco_mesh_compression_enable=False)
out.with_suffix('.provenance.json').write_text(json.dumps({'generator':'Blender background Python','blender':bpy.app.version_string,'kind':a.kind,'compression':'none','model':'procedural authored geometry','license_note':'No external assets used; no scientific behavior is encoded in the mesh.'},indent=2)+'\n')
print('ASSET_CREATED '+str(out))
