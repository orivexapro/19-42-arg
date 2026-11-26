"""Print surface and joint heights at the three contact poses."""
import bpy
from mathutils import Vector
S=bpy.context.scene
O=bpy.data.objects
for f in (45,220,361):
    S.frame_set(f)
    dg=bpy.context.evaluated_depsgraph_get()
    hand=O['Avery | anatomical body.rig']
    chair=O['ASSET_modern_arm_chair_01']
    origin=chair.location+chair.rotation_euler.to_quaternion()@Vector((-.29,.07,1))
    if f==220:
        for x in (-.34,-.32,-.30,-.28,-.26,-.24):
            origin=chair.location+chair.rotation_euler.to_quaternion()@Vector((x,.07,1))
            print('RAIL',x,[(obj.name,round((obj.matrix_world@p).z,4)) for mesh in chair.children_recursive if mesh.type=='MESH' for obj in [mesh.evaluated_get(dg)] for hit,p,n,face in [obj.ray_cast(obj.matrix_world.inverted()@origin,(obj.matrix_world.inverted().to_3x3()@Vector((0,0,-1))).normalized())] if hit])
    for name in ('hand_r','index_01_r','index_03_r','middle_01_r','middle_03_r','thumb_03_r'):
        pb=hand.pose.bones[name];print(f,name,tuple(round(v,4) for v in hand.matrix_world@pb.head),tuple(round(v,4) for v in hand.matrix_world@pb.tail))
    if f==45:
        bar=O['Long_Horizontal_Lever'];print('BAR',bar.dimensions[:],(bar.matrix_world.translation)[:])
