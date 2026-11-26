"""Measure camera clearance and contact against the evaluated Blender meshes."""
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from pathlib import Path
import bpy
S=bpy.context.scene
O=bpy.data.objects
dg=bpy.context.evaluated_depsgraph_get()

def bvh_world(obj):
    o=obj.evaluated_get(dg)
    return BVHTree.FromPolygons([o.matrix_world@v.co for v in o.data.vertices],
                                [list(p.vertices) for p in o.data.polygons])
def contact(frame,target):
    S.frame_set(frame)
    obj=O['Avery | anatomical body'].evaluated_get(dg)
    mesh=bvh_world(O[target])
    signed=[]
    for vertex in obj.data.vertices:
        p=obj.matrix_world@vertex.co
        hit,n,face,dist=mesh.find_nearest(p)
        if hit is not None:
            signed.append(dist if (p-hit).dot(n)>=0 else -dist)
    print('HAND',frame,target,'closest surface mm',round(min(map(abs,signed))*1000,2),
          'deepest signed mm',round(min(signed)*1000,2))
for name,frames in [('Long_Horizontal_Lever',[38,45,54,58]),('modern_arm_chair_01',[196,210,225,231]),('Interrupteur • course 2 mm',[357,360,361,366])]:
    for f in frames:contact(f,name)
def clearance(obj):
    best=(1000,0)
    for f in range(1,481):
        S.frame_set(f)
        p=S.camera.matrix_world.translation
        mesh=obj.evaluated_get(dg)
        ok,q,n,face=mesh.closest_point_on_mesh(mesh.matrix_world.inverted()@p)
        if ok:best=min(best,((mesh.matrix_world@q-p).length,f))
    print('EYE',obj.name,'closest mm / frame',round(best[0]*1000,1),best[1])
for obj in [O['modern_arm_chair_01'],O['Entrance_Door'],*[o for o in O['ASSET_WoodenTable_01'].children_recursive if o.type=='MESH']]:
    clearance(obj)
print('LOOSE_IMAGES',[(i.name,i.filepath) for i in bpy.data.images if i.filepath and not i.packed_file and i.source=='FILE'])
with bpy.data.libraries.load(str(Path(bpy.data.filepath).with_name('19-41_bibliotheque_braise.blend')),assets_only=True) as (src,dst):
    print('LIBRARY',sorted(src.collections))
    dst.collections=src.collections
print('APPENDED',[(c.name,len(c.all_objects)) for c in dst.collections])
