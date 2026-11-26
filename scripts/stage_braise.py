"""Run in Blender on the packed November 24 animation. Produce a sibling review scene."""
from pathlib import Path
from math import sin, cos, pi, radians
import bpy
from mathutils import Vector as V, Matrix, Quaternion

ROOT = Path(__file__).resolve().parents[1]
CINE = ROOT / 'assets/cinematic'
S = bpy.context.scene
O = bpy.data.objects
def key(obj, prop, value, frame):
    setattr(obj, prop, value)
    obj.keyframe_insert(prop, frame=frame)
def clean(o):
    o.animation_data_clear()
    o.hide_render=False
def mat(name, rgb, rough=.7, metal=0):
    m=bpy.data.materials.new(name)
    b=m.node_tree.nodes.get('Principled BSDF') if m.node_tree else None
    if not b:
        m.use_nodes=True
        b=m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value=(*rgb,1)
    b.inputs['Roughness'].default_value=rough
    b.inputs['Metallic'].default_value=metal
    return m
def paint(o,m):
    o.data.materials.clear()
    o.data.materials.append(m)
def driver(socket,expr):
    socket.driver_add('default_value').driver.expression=expr
def empty(name):
    o=O.new(name,None)
    S.collection.objects.link(o)
    return o
def box(name, pos, dims, m, bevel):
    bpy.ops.mesh.primitive_cube_add(size=1,location=pos)
    o=bpy.context.object
    o.name=name
    o.dimensions=dims
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    b=o.modifiers.new('Rayon de fabrication','BEVEL')
    b.width=bevel
    b.segments=3
    o.modifiers.new('Normales','WEIGHTED_NORMAL')
    paint(o,m)
    return o

S.frame_set(1)
S.frame_end=480
S.render.fps=30
S.view_settings.exposure=-.45
for o in tuple(O):
    if o.name.startswith('Animated_Smoke_') or o.name=='ArchiveOS_Screen_Glow':
        O.remove(o,do_unlink=True)
for name,x,w in [('Wall_Back_Left',-2.27,.46),('Wall_Back_Right',1.13,2.74)]:
    O[name].location.x=x
    O[name].dimensions.x=w
for name,z,h in [('Wall_Back_Below_Window',.41,.82),('Wall_Back_Above_Window',2.49,.62)]:
    O[name].location.z=z
    O[name].dimensions.z=h
trim=mat('Porcelaine • profil laqué',(.62,.69,.73),.42,.19)
for o in O:
    if o.name.startswith(('Window_Frame','Window_Mullion')):
        paint(o,trim)
O['Window_Glass'].hide_render=False
glass=bpy.data.materials['Window_Glass'].node_tree.nodes.get('Principled BSDF')
glass.inputs['Alpha'].default_value=.035
glass.inputs['Transmission Weight'].default_value=0
box('Appui de fenêtre',(-1.15,-2.13,.8),(1.94,.21,.045),trim,.012)
paint(O['Floor'],mat('Sol • linoléum bleu grisé',(.25,.32,.37),.78))
paint(O['Entrance_Door'],mat('Porte • laque orage',(.16,.27,.35),.58))
for side in (-1,1):
    box('Chambranle',(.505*side,2.24,1.08),(.058,.095,2.17),trim,.008)
box('Traverse de porte',(0,2.24,2.18),(1.06,.095,.058),trim,.008)
for n,e in [('Window_Daylight',110),('Interior_Softbox',95),('Ceiling_Bounce_Soft',48),('Entrance_Softbox',55),('Exterior_Fire_Bounce',16)]:
    O[n].data.energy=e
O['Window_Daylight'].data.color=(.68,.78,1)
O['Interior_Softbox'].data.color=(1,.87,.72)
O['Exterior_Fire_Bounce'].data.driver_add('energy').driver.expression='20+3*sin(frame*.27)+1.3*sin(frame*.63)'
plate=O['Paris_Panorama_Original']
plate.location=(-1.62,-3.45,1.56)
plate.scale=(2.33,1.165,1)
tree=plate.active_material.node_tree
tex=next(n for n in tree.nodes if n.type=='TEX_IMAGE')
tex.image=bpy.data.images.load(str(CINE/'source_assets/generated/paris-braise.png'))
# Split sky and city by height. Move clouds slowly, shimmer plume tips and modulate bright fire pixels.
N=tree.nodes.new
L=tree.links.new
uv=N('ShaderNodeTexCoord')
xyz=N('ShaderNodeSeparateXYZ')
L(uv.outputs['UV'],xyz.inputs[0])
def mathnode(op,a,b):
    n=N('ShaderNodeMath');n.operation=op
    for s,v in zip(n.inputs,(a,b)):
        if isinstance(v,(float,int)):s.default_value=v
        else:L(v,s)
    return n.outputs[0]
sky=mathnode('MAXIMUM',mathnode('SUBTRACT',xyz.outputs['Y'],.46),0)
phase=N('ShaderNodeValue')
driver(phase.outputs[0],'.022*sin(frame/230)')
add=N('ShaderNodeVectorMath');add.operation='ADD'
offset=N('ShaderNodeCombineXYZ')
L(mathnode('MULTIPLY',sky,phase.outputs[0]),offset.inputs['X'])
noise=N('ShaderNodeTexNoise');noise.noise_dimensions='4D'
L(uv.outputs['UV'],noise.inputs['Vector'])
noise.inputs['Scale'].default_value=26
driver(noise.inputs['W'],'frame*.013')
L(mathnode('MULTIPLY',mathnode('SUBTRACT',noise.outputs['Fac'],.5),mathnode('MULTIPLY',sky,.018)),offset.inputs['Y'])
L(uv.outputs['UV'],add.inputs[0]);L(offset.outputs[0],add.inputs[1]);L(add.outputs[0],tex.inputs[0])
colors=N('ShaderNodeSeparateColor');L(tex.outputs[0],colors.inputs[0])
fire=mathnode('MULTIPLY',mathnode('GREATER_THAN',colors.outputs[0],.74),mathnode('LESS_THAN',colors.outputs[2],.14))
flick=N('ShaderNodeValue');driver(flick.outputs[0],'.35+.27*sin(frame*.42)+.13*sin(frame*.93)')
L(mathnode('ADD',1.24,mathnode('MULTIPLY',fire,flick.outputs[0])),next(n for n in tree.nodes if n.type=='EMISSION').inputs['Strength'])

door=O['Door_Pivot'];lever=O['Long_Lever_Grip_Pivot'];bar=O['Long_Horizontal_Lever']
clean(door);clean(lever)
lever.location=(.80,.098,1.02)
O['Handle_Rose'].location=(.80,.068,1.02)
bar.location=(-.128,0,0)
for f,z in [(1,0),(46,0),(82,-84),(96,-88)]:
    key(door,'rotation_euler',(0,0,radians(z)),f)
for f,a in [(1,0),(33,0),(45,-26),(58,-26),(72,0)]:
    key(lever,'rotation_euler',(0,radians(a),0),f)
chair=O['ASSET_modern_arm_chair_01']
clean(chair)
for o in chair.children_recursive:clean(o)
chair.scale*=.68
chair.location=(.57,-.50,0)
for f,pos,angle in [(1,(.57,-.50,0),0),(196,(.57,-.50,0),0),(231,(.72,.02,0),-22),(260,(.72,.02,0),-22)]:
    key(chair,'location',pos,f);key(chair,'rotation_euler',(0,0,radians(angle)),f)
# Adjust desk and PC depth to keep the base fully supported.
pc=O['ASSET_CC0_Innerscene_Laptop'];pc.location.y-=.06;pc.location.z-=.028
bpy.context.view_layer.update()
button=box('Interrupteur • course 2 mm',(.402,-1.33,.786),(.024,.020,.006),mat('Bouton • aluminium',(.15,.19,.22),.40,.35),.0025)
for f,z in [(1,.786),(358,.786),(361,.784),(366,.784),(370,.786)]:key(button,'location',(.402,-1.33,z),f)
legend=mat('Marquage alimentation',(.7,.76,.81),.52)
lamp=legend.node_tree.nodes['Principled BSDF']
lamp.inputs['Emission Color'].default_value=(.52,.81,1,1)
for f,v in [(1,0),(361,0),(366,1.4)]:key(lamp.inputs['Emission Strength'],'default_value',v,f)
mark=bpy.data.curves.new('Symbole de mise en marche','CURVE')
mark.dimensions='3D';mark.bevel_depth=.00056;mark.bevel_resolution=2
for path in [ [(.005*cos(radians(a)),.005*sin(radians(a))) for a in range(125,416,8)], [(0,.0068),(0,.0012)] ]:
    stroke=mark.splines.new('POLY');stroke.points.add(len(path)-1)
    for pt,(x,y) in zip(stroke.points,path):pt.co=(x,y,.0031,1)
legend_obj=O.new('Témoin de marche',mark);S.collection.objects.link(legend_obj)
legend_obj.parent=button;mark.materials.append(legend)
bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=(.98,-1.25,.784))
mouse=bpy.context.object;mouse.name='Souris • coque graphite';mouse.scale=(.034,.055,.024);paint(mouse,mat('Graphite',(.038,.048,.055),.42))
box('Molette',(.98,-1.267,.807),(.006,.016,.005),trim,.002)

screen=O['Screen']
sm=mat('Dalle • ArchiveOS',(.004,.006,.009),.26)
paint(screen,sm)
nt=sm.node_tree
im=nt.nodes.new('ShaderNodeTexImage');im.image=bpy.data.images.load(str(CINE/'source_assets/generated/desktop-review.png'))
coords=nt.nodes.new('ShaderNodeTexCoord')
sep=nt.nodes.new('ShaderNodeSeparateXYZ');nt.links.new(coords.outputs['Generated'],sep.inputs[0])
combine=nt.nodes.new('ShaderNodeCombineXYZ')
nt.links.new(sep.outputs['X'],combine.inputs[0]);nt.links.new(sep.outputs['Z'],combine.inputs[1]);nt.links.new(combine.outputs[0],im.inputs[0])
b=nt.nodes['Principled BSDF'];b.inputs['Specular IOR Level'].default_value=.045;nt.links.new(im.outputs[0],b.inputs['Emission Color'])
for f,e in [(1,0),(364,0),(380,.25),(401,1.6)]:key(b.inputs['Emission Strength'],'default_value',e,f)
# Exact end-on sensor position from physical glass extents and inclination.
sc=sum((screen.matrix_world@V(v) for v in screen.bound_box),V())/8
normal=V((0,.94,.342)).normalized()
end=sc+normal*.3606
cam=O['FPV_Animation_Camera'];gaze=O['FPV_Look_Target']
clean(cam);clean(gaze);cam.data.animation_data_clear();cam.data.lens=28
cam.data.clip_start=.014
shots=[
(1,(.09,3.23,1.7),(.02,2.19,1.54)),(17,(.09,3.08,1.67),(.22,2.28,1.04)),
(36,(.12,2.81,1.58),(.23,2.28,1.035)),(54,(.10,2.70,1.56),(.14,2.14,1.02)),
(77,(.04,2.51,1.68),(.00,.4,1.40)),(98,(.03,1.88,1.69),(-.4,-1.65,1.4)),
(119,(-.14,1.27,1.71),(-1.10,-2.26,1.55)),(145,(-.22,.85,1.68),(-1.08,-2.26,1.56)),
(164,(-.16,.58,1.68),(.48,-.37,.88)),(190,(.02,.14,1.52),(.32,-.36,.78)),
(212,(.02,.32,1.49),(.46,-.05,.8)),(235,(.08,.61,1.63),(.61,.06,.78)),
(261,(-.02,.04,1.68),(.67,-.22,.77)),(281,(.06,-.59,1.66),(.58,-.98,.9)),
(299,(.50,-.59,1.62),(.60,-1.49,1.10)),(325,(.71,-.12,1.19),(.56,-1.43,1.0)),
(343,(.66,-.26,1.16),(.41,-1.37,.81)),(362,(.63,-.52,1.13),(.405,-1.385,.792)),
(383,(.65,-.34,1.16),tuple(sc)),(409,(.62,-.37,1.18),tuple(sc)),(480,tuple(end),tuple(sc))]
for f,loc,aim in shots:
    key(cam,'location',loc,f);key(gaze,'location',aim,f)
# Add small alternating footfall and head height changes only while walking.
for f in [88,104,121,138,251,268,285]:
    S.frame_set(f);l=cam.location.copy();l.z-=.017;l.x+=.011*(-1 if f%2 else 1);key(cam,'location',l,f)

hand=O['Journalist_Right_Hand_Rig'];rig=O['Avery | anatomical body.rig']
clean(hand);clean(rig)
hand.location=(0,0,0);hand.scale=(1,1,1);hand.rotation_euler=(0,0,0)
for pb in rig.pose.bones:pb.matrix_basis=Matrix.Identity(4)
bpy.context.view_layer.update()
bones=rig.data.bones
def bonepos(n):return rig.matrix_world@bones[n].head_local
wrist=bonepos('hand_r')
across=(bonepos('index_01_r')-bonepos('pinky_01_r')).normalized()
ahead=(bonepos('middle_01_r')-wrist).normalized()
def basis(a,v):
    a=V(a).normalized();v=V(v);v=(v-a*v.dot(a)).normalized()
    return Matrix((a,v,a.cross(v))).transposed()
localbasis=basis(across,ahead)
# Wrist-relative orientation, followed by surface-relative anchoring at each sampled frame.
def orient(direction,across_dir):
    return (basis(across_dir,direction)@localbasis.transposed()).to_quaternion()
grip=orient((0,-.96,-.28),(1,0,0))
reach=orient((0,-.78,-.62),(1,0,0))
seat=orient((.96,.16,-.16),(-.16,1,0))
press=orient((.16,-.86,-.45),(.94,0,-.34))
hand.rotation_mode='QUATERNION'
anchor=bonepos('middle_01_r')
skin=O['Avery | anatomical body']
group=skin.vertex_groups['index_03_r'].index
distal=[skin.matrix_world@v.co for v in skin.data.vertices if any(g.group==group and g.weight>.45 for g in v.groups)]
finger=(bonepos('index_03_r')-bonepos('index_02_r')).normalized()
front=max(v.dot(finger) for v in distal)
tip=min((v for v in distal if v.dot(finger)>front-.010),key=lambda v:(press@v).z)
# Sleeve is fitted to the wrist. It extends behind the camera-side forearm with a tailored cuff.
def sleeve():
    axis=-(ahead);side=across; perp=axis.cross(side).normalized();side=perp.cross(axis).normalized()
    verts=[];faces=[];rings=[(-.007,.028,.022),(0,.034,.025),(.030,.036,.03),(.036,.042,.035),(.12,.052,.04),(.18,.054,.047),(.19,.057,.048),(.23,.058,.050),(.30,.065,.054),(.34,.064,.058),(.39,.070,.06),(.5,.078,.068),(.69,.082,.073)]
    for i,(dist,rx,ry) in enumerate(rings):
        for j in range(16):
            a=2*pi*j/16; bend=max(0,dist-.255)
            v=wrist+axis*dist+side*(rx*cos(a)-.38*bend)+perp*(ry*sin(a)-.32*bend);verts.append(tuple(v))
            if i:faces.append(((i-1)*16+j,(i-1)*16+(j+1)%16,i*16+(j+1)%16,i*16+j))
    mesh=bpy.data.meshes.new('Sergé');mesh.from_pydata(verts,[],faces);mesh.update()
    o=O.new('Avant-bras • manche de sergé et poignet',mesh);S.collection.objects.link(o);o.parent=hand
    paint(o,mat('Sergé • encre',(.034,.061,.079),.94));o.data.materials.append(mat('Poignet • bleu brume',(.14,.22,.27),.91))
    for face in mesh.polygons:
        face.material_index=int(face.index<32)
        face.use_smooth=True
    fabric=o.data.materials[0].node_tree
    grain=fabric.nodes.new('ShaderNodeTexNoise');grain.inputs['Scale'].default_value=320
    bump=fabric.nodes.new('ShaderNodeBump');bump.inputs['Distance'].default_value=.00045;bump.inputs['Strength'].default_value=.2
    fabric.links.new(grain.outputs['Fac'],bump.inputs['Height']);fabric.links.new(bump.outputs[0],fabric.nodes['Principled BSDF'].inputs['Normal'])
sleeve()
for f in range(1,481):
    S.frame_set(f)
    def ease(a,b): 
        t=max(0,min(1,(f-a)/(b-a)));return t*t*(3-2*t)
    # Relaxed wrist goes below the visual field, with full-size geometry throughout.
    R=cam.matrix_world.to_quaternion()
    rest=cam.location+R@V((.44,-.80,-.18))
    pin=anchor;rot=reach;goal=rest;weight=0;curl=0
    if f<91:
        q=lever.matrix_world.to_quaternion()
        rot=q@grip
        goal=lever.matrix_world@V((-.13,-.002,.039))
        weight=ease(15,33)*(1-ease(58,78))
        curl=ease(28,38)*(1-ease(57,66))
    elif f<252:
        rot=chair.rotation_euler.to_quaternion()@seat
        goal=chair.location+chair.rotation_euler.to_quaternion()@V((-.277,.07,.595))
        weight=ease(165,193)*(1-ease(233,248));curl=ease(187,197)*(1-ease(232,240))
    elif f>328:
        rot=press;pin=tip
        goal=button.location+V((0,0,.0038+.035*(1-ease(347,360))))
        weight=ease(339,357)*(1-ease(366,385))
    pos=rest.lerp(goal,weight)
    key(hand,'location',pos-rot@pin,f);key(hand,'rotation_quaternion',rot,f)
    for pb in rig.pose.bones:
        if pb.name.startswith('hand'):continue
        pb.rotation_mode='QUATERNION'
        axis=(rig.matrix_world.to_quaternion()@bones[pb.name].matrix_local.to_quaternion()).inverted()@(hand.matrix_world.to_quaternion()@across)
        angle=(.24 if pb.name.startswith('thumb') else .56)*curl
        pb.rotation_quaternion=Quaternion(axis.normalized(),angle);pb.keyframe_insert('rotation_quaternion',frame=f)
S.frame_set(1)
S.render.resolution_x=854;S.render.resolution_y=480;S.render.resolution_percentage=100
S.render.image_settings.file_format='PNG'
S.render.filepath='//../braise-r03/f_'
S.render.use_overwrite=False
S.render.use_sequencer=False
S.sequence_editor_clear()
for name in ['ASSET_modern_arm_chair_01','ASSET_WoodenTable_01','Window_Daylight','Journalist_Right_Hand_Rig','ASSET_CC0_Innerscene_Laptop']:
    O[name].asset_mark()
for m in [trim,sm]:m.asset_mark()
for action in bpy.data.actions:
    if action.users:action.asset_mark()
for m,f in [('Regard poignée',17),('Prise',38),('Paris',132),('Traction',212),('Assise',325),('Contact bouton',361),('Raccord',480)]:
    S.timeline_markers.new(m,frame=f)
S['review']='Braise • gestes en revue'
S.render.image_settings.compression=18
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(CINE/'blender/19-41_braise_r03.blend'))
