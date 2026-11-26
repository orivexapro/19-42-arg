"""Finish the window reveal on R04. Keep all character action and furniture intact."""
from pathlib import Path
from mathutils import Vector
import bpy

S=bpy.context.scene
O=bpy.data.objects
# One continuous plaster reveal avoids seams cast by the bevels of the old wall panels.
old=[o for o in O if o.name.startswith('Wall_Back_')]
plaster=old[0].active_material
for o in old:o.hide_render=True
outer=[(-2.5,0),(2.5,0),(2.5,2.8),(-2.5,2.8)]
opening=[(-2.035,.82),(-.265,.82),(-.265,2.18),(-2.035,2.18)]
vs=[(x,y,z) for y in (-2.20,-2.26) for ring in (outer,opening) for x,z in ring]
fs=[]
for i in range(4):
    j=(i+1)%4
    fs.extend([(i,i+4,j+4,j),(i+8,j+8,j+12,i+12),(i+4,i+12,j+12,j+4),(i,j,j+8,i+8)])
mesh=bpy.data.meshes.new('Enduit continu');mesh.from_pydata(vs,[],fs);mesh.update()
wall=O.new('Façade intérieure • tableau monobloc',mesh);S.collection.objects.link(wall);mesh.materials.append(plaster)
glass=O['Window_Glass'].active_material
glass.surface_render_method='BLENDED'
O['Interior_Softbox'].data.color=(.90,.94,1)
day=O['Window_Daylight']
day.rotation_euler=(Vector((.27,-.15,.55))-day.location).to_track_quat('-Z','Y').to_euler()
day.data.size=2
bounce=bpy.data.lights.new('Réflexion diffuse du sol','AREA')
bounce.energy=48;bounce.shape='DISK';bounce.size=3.4;bounce.color=(.82,.89,1)
o=O.new('Réflexion diffuse du sol',bounce);S.collection.objects.link(o)
o.location=(.35,.15,.66);o.rotation_euler=(3.14159,0,0)

# Masks follow five actual sources in the original panorama. Roofs and ironwork stay rigid.
nt=O['Paris_Panorama_Original'].active_material.node_tree
def fn(op,a,b=0):
    n=nt.nodes.new('ShaderNodeMath');n.operation=op
    for sock,v in zip(n.inputs,(a,b)):
        if isinstance(v,(float,int)):sock.default_value=v
        else:nt.links.new(v,sock)
    return n.outputs[0]
def clamp(x):return fn('MINIMUM',1,fn('MAXIMUM',0,x))
x,y=nt.nodes['Separate XYZ'].outputs[:2]
height=fn('SUBTRACT',y,.45)
up=clamp(fn('MULTIPLY',height,32))
ceiling=clamp(fn('MULTIPLY',fn('SUBTRACT',.87,y),8))
plumes=0
firebeds=0
for source in (.208,.286,.438,.565,.865):
    centre=fn('SUBTRACT',source,fn('MULTIPLY',height,1.02))
    radius=fn('ADD',.013,fn('MULTIPLY',fn('MAXIMUM',0,height),.27))
    plume=clamp(fn('SUBTRACT',1,fn('DIVIDE',fn('ABSOLUTE',fn('SUBTRACT',x,centre)),radius)))
    plumes=fn('MAXIMUM',plumes,plume)
    near=clamp(fn('SUBTRACT',1,fn('MULTIPLY',fn('ABSOLUTE',fn('SUBTRACT',x,source)),62)))
    firebeds=fn('MAXIMUM',firebeds,near)
firebeds=fn('MULTIPLY',firebeds,clamp(fn('SUBTRACT',1,fn('MULTIPLY',fn('ABSOLUTE',height),48))))
smoke=fn('MULTIPLY',plumes,fn('MULTIPLY',up,ceiling))
noise=nt.nodes['Noise Texture']
noise.inputs['Scale'].default_value=37
drift=fn('SUBTRACT',noise.outputs['Fac'],.5)
# Far sky drift feathered out around the tower and near roofline.
sky=clamp(fn('MULTIPLY',fn('SUBTRACT',y,.63),4))
tower=clamp(fn('MULTIPLY',fn('SUBTRACT',fn('ABSOLUTE',fn('SUBTRACT',x,.708)),.017),35))
sky=fn('MULTIPLY',sky,tower)
offset=nt.nodes['Combine XYZ']
nt.links.new(fn('ADD',fn('MULTIPLY',sky,nt.nodes['Value'].outputs[0]),fn('MULTIPLY',drift,fn('MULTIPLY',smoke,.026))),offset.inputs['X'])
nt.links.new(fn('MULTIPLY',drift,fn('ADD',fn('MULTIPLY',smoke,.026),fn('MULTIPLY',firebeds,.015))),offset.inputs['Y'])
S.frame_set(1)
S.render.filepath='//../braise-r05/f_'
bpy.ops.wm.save_as_mainfile(filepath=str(Path(bpy.data.filepath).with_name('19-41_braise_r05.blend')))
