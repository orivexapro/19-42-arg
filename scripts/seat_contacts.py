"""Refine sub-centimetre spacing on the R03 keys against the evaluated surfaces."""
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from pathlib import Path
import bpy
S=bpy.context.scene
O=bpy.data.objects
dg=bpy.context.evaluated_depsgraph_get()
hand=O['Journalist_Right_Hand_Rig']
skin=O['Avery | anatomical body']
def smooth(t):
    t=min(1,max(0,t))
    return t*t*(3-2*t)
def mesh(obj):
    obj=obj.evaluated_get(dg)
    return BVHTree.FromPolygons([obj.matrix_world@v.co for v in obj.data.vertices],[p.vertices[:] for p in obj.data.polygons])
def offset(target,f):
    S.frame_set(f)
    tree=mesh(target)
    obj=skin.evaluated_get(dg)
    points=[obj.matrix_world@v.co for v in obj.data.vertices]
    delta=Vector((0,0,0))
    for _ in range(4):
        nearest=100
        for vertex in points:
            p=vertex+delta
            q,n,k,d=tree.find_nearest(p)
            if (p-q).dot(n)<0:d=-d
            if d<nearest:
                nearest=d
                correction=q-p+n*.00015
        if abs(nearest-.00015)<.00006:break
        delta+=correction
    return delta
for name,a,b,c,d in [('Long_Horizontal_Lever',24,37,58,69),('modern_arm_chair_01',180,196,232,246),('Interrupteur • course 2 mm',350,360,366,373)]:
    target=O[name]
    offsets={f:offset(target,f) for f in range(b,c+1)}
    for f in range(a,d+1):
        S.frame_set(f)
        move=offsets[min(c,max(b,f))]*smooth((f-a)/(b-a))*smooth((d-f)/(d-c))
        hand.location+=move
        hand.keyframe_insert('location',frame=f)
    print(name,'largest correction mm',max(v.length for v in offsets.values())*1000)
S.frame_set(1)
base=Path(bpy.data.filepath).parent
S.render.filepath='//../braise-r04/f_'
bpy.ops.wm.save_as_mainfile(filepath=str(base/'19-41_braise_r04.blend'))
