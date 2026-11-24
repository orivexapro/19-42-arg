import bpy
import math
import os
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "cinematic" / "source_assets"
OUTPUT = ROOT / "assets" / "cinematic" / "previews"
SOURCE = ROOT / "assets" / "cinematic" / "blender"
OUTPUT.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(parents=True, exist_ok=True)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)


def material(name, color, roughness=0.65, metallic=0.0, emission=None):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission[0], 1)
        bsdf.inputs["Emission Strength"].default_value = emission[1]
    return mat


def white_wall_material():
    mat = material("Wall_White_Matte_Marble020_Adapted", (0.92, 0.925, 0.92), 0.88)
    image_path = ASSETS / "ambientcg" / "Marble020" / "Marble020_1K-JPG_Color.jpg"
    if image_path.exists():
        nodes = mat.node_tree.nodes
        links = mat.node_tree.links
        image = nodes.new("ShaderNodeTexImage")
        image.image = bpy.data.images.load(str(image_path), check_existing=True)
        image.label = "Marble020 CC0 — influence 3%"
        mix = nodes.new("ShaderNodeMixRGB")
        mix.blend_type = "MIX"
        mix.inputs[0].default_value = 0.03
        mix.inputs[1].default_value = (0.94, 0.945, 0.94, 1)
        links.new(image.outputs["Color"], mix.inputs[2])
        links.new(mix.outputs["Color"], nodes["Principled BSDF"].inputs["Base Color"])
    return mat


def cube(name, location, scale, mat, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat:
        obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new("Soft manufactured edges", "BEVEL")
        mod.width = bevel
        mod.segments = 3
    return obj


def cylinder(name, location, radius, depth, mat, rotation=(0, 0, 0), vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return obj


def add_camera(name, location, target, lens=40):
    data = bpy.data.cameras.new(name)
    data.lens = lens
    data.sensor_width = 36
    data.dof.use_dof = True
    data.dof.focus_distance = max(0.1, (Vector(target) - Vector(location)).length)
    data.dof.aperture_fstop = 5.6
    cam = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(cam)
    cam.location = location
    look_at(cam, target)
    return cam


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def append_polyhaven(asset_id, location, target_width, rotation=(0, 0, 0), z_stretch=1.0):
    path = ASSETS / "polyhaven" / asset_id / f"{asset_id}_1k.blend"
    before = set(bpy.data.objects)
    with bpy.data.libraries.load(str(path), link=False) as (src, dst):
        dst.objects = [name for name in src.objects if name]
    imported = [obj for obj in dst.objects if obj and obj not in before and obj.type == "MESH"]
    for obj in imported:
        if obj.name not in bpy.context.collection.objects:
            bpy.context.collection.objects.link(obj)
    if not imported:
        raise RuntimeError(f"No meshes imported from {path}")
    corners = []
    for obj in imported:
        corners.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    min_v = Vector((min(v.x for v in corners), min(v.y for v in corners), min(v.z for v in corners)))
    max_v = Vector((max(v.x for v in corners), max(v.y for v in corners), max(v.z for v in corners)))
    center = Vector(((min_v.x + max_v.x) / 2, (min_v.y + max_v.y) / 2, min_v.z))
    parent = bpy.data.objects.new(f"ASSET_{asset_id}", None)
    bpy.context.collection.objects.link(parent)
    for obj in imported:
        obj.matrix_world.translation -= center
        world = obj.matrix_world.copy()
        obj.parent = parent
        obj.matrix_world = world
    size_x = max(0.01, max_v.x - min_v.x)
    uniform = target_width / size_x
    parent.scale = (uniform, uniform, uniform * z_stretch)
    parent.location = location
    parent.rotation_euler = rotation
    parent["source"] = f"https://polyhaven.com/a/{asset_id}"
    parent["license"] = "CC0 1.0"
    return parent


def add_room():
    wall = white_wall_material()
    floor = material("Floor_Light_Oak_Matte", (0.48, 0.34, 0.23), 0.72)
    ceiling = material("Ceiling_White_Matte", (0.95, 0.95, 0.94), 0.92)
    # 5.0 x 4.4 x 2.8 m, one window and one entrance.
    cube("Floor", (0, 0, -0.06), (2.5, 2.2, 0.06), floor)
    cube("Ceiling", (0, 0, 2.83), (2.5, 2.2, 0.03), ceiling)
    cube("Wall_Left", (-2.53, 0, 1.4), (0.03, 2.2, 1.4), wall)
    cube("Wall_Right", (2.53, 0, 1.4), (0.03, 2.2, 1.4), wall)
    # Back wall around a single 1.8 x 1.35 m window.
    cube("Wall_Back_Left", (-2.05, -2.23, 1.4), (0.45, 0.03, 1.4), wall)
    cube("Wall_Back_Right", (0.80, -2.23, 1.4), (1.70, 0.03, 1.4), wall)
    cube("Wall_Back_Below_Window", (-1.15, -2.23, 0.48), (0.90, 0.03, 0.48), wall)
    cube("Wall_Back_Above_Window", (-1.15, -2.23, 2.52), (0.90, 0.03, 0.28), wall)
    # Front wall around a 0.95 x 2.15 m entrance.
    cube("Wall_Front_Left", (-1.49, 2.23, 1.4), (1.01, 0.03, 1.4), wall)
    cube("Wall_Front_Right", (1.49, 2.23, 1.4), (1.01, 0.03, 1.4), wall)
    cube("Wall_Front_Above_Door", (0, 2.23, 2.48), (0.48, 0.03, 0.32), wall)
    frame = material("Window_Frame_Black_Aluminium", (0.025, 0.03, 0.035), 0.38, 0.72)
    glass = material("Window_Glass", (0.15, 0.22, 0.28), 0.12)
    glass.diffuse_color = (0.15, 0.22, 0.28, 0.22)
    glass.surface_render_method = "DITHERED"
    glass_bsdf = glass.node_tree.nodes.get("Principled BSDF")
    if glass_bsdf:
        glass_bsdf.inputs["Base Color"].default_value = (.10, .15, .18, 1)
        glass_bsdf.inputs["Roughness"].default_value = .08
        glass_bsdf.inputs["Transmission Weight"].default_value = .88
        glass_bsdf.inputs["Alpha"].default_value = .18
        glass_bsdf.inputs["IOR"].default_value = 1.45
    window_glass = cube("Window_Glass", (-1.15, -2.20, 1.50), (0.86, 0.015, 0.64), glass)
    window_glass.hide_render = True
    for x, z, sx, sz in [(-2.03, 1.50, .035, .72), (-.27, 1.50, .035, .72), (-1.15, .82, .92, .035), (-1.15, 2.18, .92, .035)]:
        cube("Window_Frame", (x, -2.17, z), (sx, .035, sz), frame, .008)
    cube("Window_Mullion", (-1.15, -2.16, 1.50), (.025, .035, .66), frame, .006)
    return wall


def add_door():
    door_mat = material("Door_Warm_Oak", (0.33, 0.18, 0.10), 0.58)
    metal = material("Handle_Brushed_Steel", (0.18, 0.19, 0.20), 0.22, 0.86)
    pivot = bpy.data.objects.new("Door_Pivot", None)
    bpy.context.collection.objects.link(pivot)
    pivot.location = (-0.475, 2.19, 0)
    door = cube("Entrance_Door", (0.475, 0, 1.075), (0.475, .045, 1.075), door_mat, .025)
    door.parent = pivot
    rose = cylinder("Handle_Rose", (0.29, 0.07, 1.0), .065, .035, metal, (math.pi/2, 0, 0))
    lever = cylinder("Long_Horizontal_Lever", (0.16, 0.095, 1.0), .025, .30, metal, (0, math.pi/2, 0))
    rose.parent = pivot
    lever.parent = pivot
    pivot.rotation_euler.z = 0
    pivot["handle_height_m"] = 1.0
    pivot["animation_note"] = "Frames 0-90: grip, lever down, door open, release."
    pivot.rotation_euler.z = 0
    pivot.keyframe_insert("rotation_euler", frame=1)
    pivot.rotation_euler.z = math.radians(72)
    pivot.keyframe_insert("rotation_euler", frame=90)
    pivot.rotation_euler.z = 0
    return pivot, lever


def add_computer_proxy():
    collection = bpy.data.collections.new("PROXY_COMPUTER_TURBOSQUID_LICENSE_UNVERIFIED")
    bpy.context.scene.collection.children.link(collection)
    dark = material("Computer_Dark_Plastic", (0.028, 0.035, 0.04), .48)
    metal = material("Computer_Stand_Metal", (.18, .20, .22), .35, .72)
    screen_mat = material("ArchiveOS_Screen", (.015, .08, .11), .22, emission=((.02, .30, .38), 2.8))
    def move_to_collection(obj):
        for owner in list(obj.users_collection):
            owner.objects.unlink(obj)
        collection.objects.link(obj)
    monitor = cube("Proxy_Monitor", (.62, -1.62, 1.32), (.56, .06, .36), dark, .025); move_to_collection(monitor)
    screen = cube("Proxy_Monitor_Screen", (.62, -1.548, 1.32), (.50, .008, .30), screen_mat, .012); move_to_collection(screen)
    stand = cube("Proxy_Monitor_Stand", (.62, -1.62, .90), (.06, .07, .22), metal, .012); move_to_collection(stand)
    base = cube("Proxy_Monitor_Base", (.62, -1.53, .74), (.25, .18, .025), metal, .014); move_to_collection(base)
    keyboard = cube("Proxy_Keyboard", (.55, -1.02, .77), (.47, .19, .025), dark, .018); move_to_collection(keyboard)
    keymat = material("Keyboard_Keys", (.18, .20, .21), .6)
    for row in range(4):
        for col in range(12):
            key = cube(f"Key_{row:02}_{col:02}", (.15 + col*.073, -0.92-row*.075, .803), (.029, .026, .008), keymat, .004)
            move_to_collection(key)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, location=(1.23, -1.02, .81), scale=(.08, .12, .045))
    mouse = bpy.context.object; mouse.name = "Proxy_Mouse"; mouse.data.materials.append(dark); move_to_collection(mouse)
    collection["status"] = "Temporary proxy: specified TurboSquid listing could not be verified as free."
    return monitor


def add_city():
    concrete = material("Paris_Buildings", (.075, .085, .10), .82)
    warm = material("Distant_Fire", (.34, .055, .008), .35, emission=((1.0, .12, .01), 16))
    smoke = material("Smoke", (.025, .028, .03), 1.0)
    smoke.diffuse_color = (.025, .028, .03, .62)
    smoke.surface_render_method = "DITHERED"
    for i in range(14):
        x = -7 + i * 1.05
        y = -18.5 - (i % 3) * 2.6
        h = 2.8 + (i * 1.37 % 4.2)
        b = cube(f"Paris_Block_{i:02}", (x, y, h/2), (.42 + (i%2)*.18, .55, h/2), concrete, .035)
        for row in range(max(2, int(h))):
            if (row + i) % 3 == 0:
                cube(f"Fire_Window_{i}_{row}", (x, y+.57, .55+row*.72), (.12, .012, .16), warm)
    # Restrained Eiffel Tower silhouette; city remains standing.
    steel = material("Eiffel_Silhouette", (.018, .02, .023), .55, .75)
    for side in (-1, 1):
        leg = cube("Eiffel_Leg", (-4.5 + side*.28, -23, 1.65), (.045, .045, 1.75), steel)
        leg.rotation_euler.y = math.radians(side * 8)
    cylinder("Eiffel_Spire", (-4.5, -23, 4.15), .035, 2.0, steel)
    for x, y, z in [(-3.1,-19.2,1.0), (1.3,-21.2,1.6), (4.1,-20.0,.9)]:
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=.32, location=(x,y,z))
        fire = bpy.context.object; fire.name="Distant_Fire_Glow"; fire.scale=(1.1,.5,1.8); fire.data.materials.append(warm)
        for s in range(4):
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=.38+s*.12, location=(x+.08*s,y-.2*s,z+1+s*.55))
            puff=bpy.context.object; puff.name="Smoke_Plume"; puff.scale=(1.2,.8,1.5); puff.data.materials.append(smoke)


def add_hand(lever):
    path = ROOT / "assets" / "models" / "hand-posable.glb"
    bpy.ops.import_scene.gltf(filepath=str(path))
    imported = list(bpy.context.selected_objects)
    skin = material("Journalist_Skin_Matte", (.28, .105, .055), .82)
    parent = bpy.data.objects.new("Journalist_Right_Hand_Rig", None)
    bpy.context.collection.objects.link(parent)
    for obj in imported:
        world = obj.matrix_world.copy()
        obj.parent = parent
        obj.matrix_world = world
        if obj.type == "MESH":
            obj.data.materials.clear()
            obj.data.materials.append(skin)
    parent.location = (-.18, 2.47, .96)
    parent.rotation_euler = (math.radians(86), math.radians(2), math.radians(-18))
    parent.scale = (1.05, 1.05, 1.05)
    armature = next((obj for obj in imported if obj.type == "ARMATURE"), None)
    if armature:
        for name in ("index_01_r","middle_01_r","ring_01_r","pinky_01_r"):
            bone = armature.pose.bones.get(name)
            if bone:
                bone.rotation_mode = "XYZ"
                bone.rotation_euler.z = math.radians(-24)
        for name in ("index_02_r","middle_02_r","ring_02_r","pinky_02_r"):
            bone = armature.pose.bones.get(name)
            if bone:
                bone.rotation_mode = "XYZ"
                bone.rotation_euler.z = math.radians(-38)
        thumb = armature.pose.bones.get("thumb_01_r")
        if thumb:
            thumb.rotation_mode = "XYZ"
            thumb.rotation_euler.z = math.radians(-25)
    parent["source"] = "Innerscene / MakeHuman anatomical right hand"
    parent["license"] = "CC0 1.0"
    return parent


def add_lights():
    world = bpy.context.scene.world or bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (.018, .028, .045, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = .32
    def area(name, loc, energy, size, color, target):
        data = bpy.data.lights.new(name, "AREA"); data.energy=energy; data.shape="DISK"; data.size=size; data.color=color
        obj=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(obj); obj.location=loc; look_at(obj,target); return obj
    area("Window_Daylight", (-1.1,-1.75,2.15), 520, 2.0, (.60,.76,1.0), (0,0,1))
    area("Interior_Softbox", (1.8,.4,2.5), 320, 1.6, (1.0,.80,.63), (.4,-.7,1))
    area("Entrance_Softbox", (-.20,3.10,2.25), 110, 1.35, (.72,.82,1.0), (-.25,2.18,1.0))
    data=bpy.data.lights.new("Exterior_Fire_Bounce","POINT"); data.energy=430; data.color=(1.0,.13,.02); data.shadow_soft_size=2.0
    obj=bpy.data.objects.new("Exterior_Fire_Bounce",data); bpy.context.collection.objects.link(obj); obj.location=(-1.2,-4.0,1.0)


def render_preview(filename, camera, hide_hand=False, hide_chair=False, door_angle=0):
    hand = bpy.data.objects.get("Journalist_Right_Hand_Rig")
    if hand:
        hand.hide_render = hide_hand
    door = bpy.data.objects.get("Door_Pivot")
    if door:
        door.rotation_euler.z = math.radians(door_angle)
    chair = bpy.data.objects.get("ASSET_modern_arm_chair_01")
    if chair:
        chair.hide_render = hide_chair
        for child in chair.children_recursive:
            child.hide_render = hide_chair
    scene = bpy.context.scene
    scene.camera = camera
    scene.render.filepath = str(OUTPUT / filename)
    bpy.ops.render.render(write_still=True)


clear_scene()
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 1440
scene.render.resolution_y = 810
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.film_transparent = False
scene.render.image_settings.color_depth = "8"
scene.render.image_settings.compression = 20
scene.render.fps = 30
scene.frame_start = 1
scene.frame_end = 450
scene.render.engine = "BLENDER_EEVEE"
scene.view_settings.look = "AgX - Medium High Contrast"
scene["cinematic_duration_seconds"] = 15
scene["art_direction"] = "PS1/PS2 retro-realism; clean white apartment; psychological thriller"
scene["computer_asset_status"] = "Proxy pending verifiable free access to TurboSquid product 1480337"

add_room()
door, lever = add_door()
table = append_polyhaven("WoodenTable_01", (.58, -1.36, 0), 1.72, z_stretch=1.45)
chair = append_polyhaven("modern_arm_chair_01", (.55, -.20, 0), 1.02, rotation=(0,0,math.radians(180)))
lamp = append_polyhaven("industrial_pipe_lamp", (1.30, -1.30, .78), .30, rotation=(0,0,math.radians(-25)))
chair.keyframe_insert("location", frame=180)
chair.location.y += .34
chair.keyframe_insert("location", frame=255)
chair.location.y -= .34
add_computer_proxy()
add_city()
hand = add_hand(lever)
add_lights()

cam_handle = add_camera("PREVIEW_01_Handle_Grip", (-.10, 3.03, 1.55), (-.25, 2.18, 1.00), 48)
cam_room = add_camera("PREVIEW_02_White_Room", (2.28, 1.78, 2.05), (.05, -.75, 1.00), 28)
cam_window = add_camera("PREVIEW_03_Paris_Fires", (-1.15, -.48, 1.52), (-1.15, -20.0, 1.65), 42)
cam_seated = add_camera("PREVIEW_04_Seated_Computer", (.56, .25, 1.25), (.62, -1.35, 1.05), 42)

scene.frame_set(1)
render_preview("01_hand_handle.png", cam_handle, hide_hand=False, door_angle=0)
render_preview("02_white_room.png", cam_room, hide_hand=True, door_angle=48)
render_preview("03_paris_window.png", cam_window, hide_hand=True, door_angle=48)
render_preview("04_seated_computer.png", cam_seated, hide_hand=True, hide_chair=True, door_angle=48)

# Restore storyboard start state and save the editable source with local resources packed.
scene.frame_set(1)
door.rotation_euler.z = 0
hand.hide_render = False
chair.hide_render = False
for child in chair.children_recursive:
    child.hide_render = False
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE / "19-41_intro_preview.blend"))
print(f"BLENDER_PREVIEWS_READY {OUTPUT}")
