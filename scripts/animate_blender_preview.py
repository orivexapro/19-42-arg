"""Upgrade the approved Blender scene and render the 14 s 480p animation preview."""

from pathlib import Path
import math
import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[1]
SOURCE_BLEND = ROOT / "assets" / "cinematic" / "blender" / "19-41_intro_preview.blend"
OUTPUT_BLEND = ROOT / "assets" / "cinematic" / "blender" / "19-41_intro_animation_preview.blend"
OUTPUT_VIDEO = ROOT / "assets" / "cinematic" / "previews" / "19-41_intro_preview_480p.mp4"
OUTPUT_FRAMES = ROOT / "assets" / "cinematic" / "previews" / "frames_480p"
PANORAMA = ROOT / "assets" / "cinematic" / "source_assets" / "generated" / "paris_apocalypse_panorama.png"
LAPTOP = ROOT / "assets" / "cinematic" / "source_assets" / "innerscene" / "laptop-15-6-inch-open.glb"
AUDIO = ROOT / "assets" / "cinematic" / "audio" / "source"


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def key_transform(obj, frame, location, target, lens=None):
    obj.location = location
    look_at(obj, target)
    obj.keyframe_insert("location", frame=frame)
    obj.keyframe_insert("rotation_euler", frame=frame)
    if lens is not None:
        obj.data.lens = lens
        obj.data.keyframe_insert("lens", frame=frame)


def remove_named(prefixes):
    for obj in list(bpy.data.objects):
        if any(obj.name.startswith(prefix) for prefix in prefixes):
            bpy.data.objects.remove(obj, do_unlink=True)


def make_panorama():
    remove_named(("Paris_Block_", "Fire_Window_", "Eiffel_", "Distant_Fire_Glow", "Smoke_Plume"))
    image = bpy.data.images.load(str(PANORAMA), check_existing=True)
    mat = bpy.data.materials.new("Paris_Apocalypse_Panorama")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Strength"].default_value = 0.72
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = image
    tex.interpolation = "Linear"
    links.new(tex.outputs["Color"], emission.inputs["Color"])
    links.new(emission.outputs["Emission"], out.inputs["Surface"])
    bpy.ops.mesh.primitive_plane_add(size=2, location=(-1.15, -2.55, 1.50), rotation=(math.pi / 2, 0, 0))
    plane = bpy.context.object
    plane.name = "Paris_Panorama_Original"
    plane.scale = (1.08, .76, 1)
    plane.data.materials.append(mat)

    smoke_mat = bpy.data.materials.new("Animated_Paris_Smoke")
    smoke_mat.use_nodes = True
    smoke_mat.surface_render_method = "DITHERED"
    bsdf = smoke_mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.012, 0.016, 0.022, 1)
    bsdf.inputs["Roughness"].default_value = 1
    bsdf.inputs["Alpha"].default_value = 0.06
    for i, (x, z, scale) in enumerate(((-1.65, 1.62, .18), (-1.15, 1.82, .22), (-.68, 1.48, .16))):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=1, location=(x, -2.42, z))
        puff = bpy.context.object
        puff.name = f"Animated_Smoke_{i+1}"
        puff.scale = (scale * .72, .32, scale * 1.45)
        puff.data.materials.append(smoke_mat)
        puff.location.x -= .18
        puff.keyframe_insert("location", frame=1)
        puff.scale *= .93
        puff.keyframe_insert("scale", frame=1)
        puff.location.x += .55
        puff.location.z += .48
        puff.keyframe_insert("location", frame=336)
        puff.scale *= 1.18
        puff.keyframe_insert("scale", frame=336)


def import_laptop():
    old = bpy.data.collections.get("PROXY_COMPUTER_TURBOSQUID_LICENSE_UNVERIFIED")
    if old:
        for obj in list(old.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.collections.remove(old)
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(LAPTOP))
    imported = [obj for obj in bpy.data.objects if obj not in before]
    root = bpy.data.objects.new("ASSET_CC0_Innerscene_Laptop", None)
    bpy.context.collection.objects.link(root)
    for obj in imported:
        if obj.parent is None:
            obj.parent = root
    root.location = (0.60, -1.18, 0.79)
    root.rotation_euler = (0, 0, math.radians(180))
    root.scale = (1.35, 1.35, 1.35)
    root["source"] = "https://www.innerscene.com/tools/library/3d-parts/laptop-15-6-inch-open-c70532c1"
    root["license"] = "CC0 1.0"
    root["sha256"] = "3e7cfa3f8fdc9050fc08838aeffc0c443de7bf9e2afb53abb9c4d7aee3e8eb66"

    glow_mat = bpy.data.materials.get("ArchiveOS_Power_Glow") or bpy.data.materials.new("ArchiveOS_Power_Glow")
    glow_mat.use_nodes = True
    bsdf = glow_mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.006, 0.025, 0.04, 1)
    bsdf.inputs["Emission Color"].default_value = (0.02, 0.55, 0.72, 1)
    bsdf.inputs["Emission Strength"].default_value = 0.0
    bsdf.inputs["Roughness"].default_value = .18
    bpy.ops.mesh.primitive_plane_add(size=2, location=(0.60, -1.365, 1.03), rotation=(math.radians(70), 0, 0))
    glow = bpy.context.object
    glow.name = "ArchiveOS_Screen_Glow"
    glow.scale = (.205, .12, 1)
    glow.data.materials.append(glow_mat)
    bsdf.inputs["Emission Strength"].default_value = 0.0
    bsdf.inputs["Emission Strength"].keyframe_insert("default_value", frame=250)
    bsdf.inputs["Emission Strength"].default_value = 4.2
    bsdf.inputs["Emission Strength"].keyframe_insert("default_value", frame=272)
    return root


def animate_door_and_hand():
    door = bpy.data.objects["Door_Pivot"]
    door.animation_data_clear()
    door.rotation_euler.z = 0
    door.keyframe_insert("rotation_euler", frame=1)
    door.keyframe_insert("rotation_euler", frame=48)
    door.rotation_euler.z = math.radians(72)
    door.keyframe_insert("rotation_euler", frame=92)

    lever = bpy.data.objects["Long_Horizontal_Lever"]
    handle_pivot = bpy.data.objects.new("Long_Lever_Grip_Pivot", None)
    bpy.context.collection.objects.link(handle_pivot)
    handle_pivot.parent = door
    handle_pivot.location = lever.location.copy()
    lever.parent = handle_pivot
    lever.location = (0, 0, 0)
    handle_pivot.rotation_mode = "XYZ"
    handle_pivot.rotation_euler.y = 0
    handle_pivot.keyframe_insert("rotation_euler", frame=1)
    handle_pivot.keyframe_insert("rotation_euler", frame=34)
    handle_pivot.rotation_euler.y = math.radians(-27)
    handle_pivot.keyframe_insert("rotation_euler", frame=48)
    handle_pivot.rotation_euler.y = 0
    handle_pivot.keyframe_insert("rotation_euler", frame=70)

    hand = bpy.data.objects["Journalist_Right_Hand_Rig"]
    hand.animation_data_clear()
    hand.rotation_mode = "XYZ"
    for frame, loc, rot in (
        (1, (-.01, 2.94, .83), (82, 8, -10)),
        (22, (-.08, 2.67, .90), (84, 5, -15)),
        (38, (-.18, 2.47, .96), (86, 2, -18)),
        (56, (-.18, 2.47, .90), (86, 2, -18)),
        (78, (-.04, 2.70, .84), (80, 8, -5)),
        (100, (.20, 2.35, .70), (74, 14, 20)),
        (132, (.84, .34, .76), (78, -8, 24)),
        (160, (.83, .12, .76), (82, -12, 18)),
        (182, (.83, .46, .73), (82, -12, 18)),
        (202, (1.02, .22, .62), (76, 2, 28)),
    ):
        hand.location = loc
        hand.rotation_euler = tuple(math.radians(v) for v in rot)
        hand.keyframe_insert("location", frame=frame)
        hand.keyframe_insert("rotation_euler", frame=frame)
    hand.hide_render = False
    for frame, value in ((1, 1.05), (100, 1.05), (112, .01), (126, .01), (138, 1.05), (190, 1.05), (205, .01)):
        hand.scale = (value, value, value)
        hand.keyframe_insert("scale", frame=frame)

    armature = next((o for o in hand.children_recursive if o.type == "ARMATURE"), None)
    if armature:
        finger_names = [f"{finger}_{joint:02}_r" for finger in ("index", "middle", "ring", "pinky") for joint in (1, 2, 3)]
        for name in finger_names:
            bone = armature.pose.bones.get(name)
            if not bone:
                continue
            bone.rotation_mode = "XYZ"
            bone.rotation_euler.z = math.radians(-5)
            bone.keyframe_insert("rotation_euler", frame=1)
            bone.keyframe_insert("rotation_euler", frame=24)
            joint = int(name.split("_")[1])
            bone.rotation_euler.z = math.radians(-28 - joint * 10)
            bone.keyframe_insert("rotation_euler", frame=40)
            bone.keyframe_insert("rotation_euler", frame=60)
            bone.rotation_euler.z = math.radians(-8)
            bone.keyframe_insert("rotation_euler", frame=82)
        thumb = armature.pose.bones.get("thumb_01_r")
        if thumb:
            thumb.rotation_mode = "XYZ"
            thumb.rotation_euler.z = math.radians(-8)
            thumb.keyframe_insert("rotation_euler", frame=24)
            thumb.rotation_euler.z = math.radians(-38)
            thumb.keyframe_insert("rotation_euler", frame=42)
            thumb.keyframe_insert("rotation_euler", frame=60)
            thumb.rotation_euler.z = math.radians(-10)
            thumb.keyframe_insert("rotation_euler", frame=82)


def animate_chair():
    chair = bpy.data.objects["ASSET_modern_arm_chair_01"]
    chair.animation_data_clear()
    base = chair.location.copy()
    chair.location = base
    chair.keyframe_insert("location", frame=1)
    chair.keyframe_insert("location", frame=150)
    chair.location = base + Vector((0, .50, 0))
    chair.keyframe_insert("location", frame=178)
    chair.keyframe_insert("location", frame=205)
    chair.location = base + Vector((0, .32, 0))
    chair.keyframe_insert("location", frame=232)
    for obj in (chair, *chair.children_recursive):
        obj.hide_render = False
        obj.keyframe_insert("hide_render", frame=204)
        obj.hide_render = True
        obj.keyframe_insert("hide_render", frame=214)


def animate_camera():
    data = bpy.data.cameras.new("FPV_Animation_Camera")
    cam = bpy.data.objects.new("FPV_Animation_Camera", data)
    bpy.context.collection.objects.link(cam)
    target = bpy.data.objects.new("FPV_Look_Target", None)
    bpy.context.collection.objects.link(target)
    track = cam.constraints.new("TRACK_TO")
    track.target = target
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis = "UP_Y"
    data.lens = 46
    data.sensor_width = 36
    points = (
        (1, (-.10, 3.04, 1.64), (-.32, 2.28, 1.02), 48),
        (38, (-.10, 3.02, 1.62), (-.32, 2.28, .99), 48),
        (70, (-.08, 2.94, 1.63), (-.18, 2.05, 1.08), 46),
        (96, (-.02, 1.95, 1.66), (.28, .15, 1.05), 44),
        (112, (.04, 1.36, 1.63), (-1.15, -2.18, 1.48), 43),
        (132, (.15, .90, 1.65), (-1.15, -2.18, 1.48), 43),
        (150, (.55, .55, 1.60), (.55, -.10, .78), 44),
        (170, (.95, .30, 1.52), (.55, .08, .78), 45),
        (190, (.82, .05, 1.42), (.56, -.62, .90), 45),
        (218, (.55, -.02, 1.30), (.59, -1.12, .98), 46),
        (254, (.55, -.05, 1.27), (.60, -1.28, 1.04), 46),
        (288, (.56, -.08, 1.28), (.60, -1.28, 1.05), 46),
        (320, (.58, -.55, 1.22), (.60, -1.30, 1.05), 48),
        (336, (.595, -.85, 1.13), (.60, -1.32, 1.05), 50),
    )
    for frame, loc, target, lens in points:
        cam.location = loc
        cam.keyframe_insert("location", frame=frame)
        data.lens = lens
        data.keyframe_insert("lens", frame=frame)
        bpy.data.objects["FPV_Look_Target"].location = target
        bpy.data.objects["FPV_Look_Target"].keyframe_insert("location", frame=frame)
    bpy.context.scene.camera = cam


def improve_lighting():
    world = bpy.context.scene.world
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (.012, .021, .04, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = .18
    for name, energy in (("Window_Daylight", 820), ("Interior_Softbox", 520), ("Entrance_Softbox", 180), ("Exterior_Fire_Bounce", 620)):
        obj = bpy.data.objects.get(name)
        if obj and obj.type == "LIGHT":
            obj.data.energy = energy
            obj.data.use_shadow = True
    data = bpy.data.lights.new("Ceiling_Bounce_Soft", "AREA")
    data.energy = 260
    data.color = (1.0, .86, .72)
    data.shape = "DISK"
    data.size = 1.8
    obj = bpy.data.objects.new("Ceiling_Bounce_Soft", data)
    bpy.context.collection.objects.link(obj)
    obj.location = (.25, -.3, 2.65)
    look_at(obj, (.35, -.4, .4))


def add_audio():
    scene = bpy.context.scene
    editor = scene.sequence_editor_create()
    for strip in list(editor.strips):
        editor.strips.remove(strip)
    specs = (
        ("Door handle and opening — Freesound 868519 CC0", "door-handle-open.mp3", 1, 32, .86),
        ("Recorded interior footsteps — Freesound 776197 CC0", "footsteps-interior.mp3", 2, 84, .50),
        ("Recorded chair drag — Freesound 802694 CC0", "chair-drag.mp3", 3, 160, .56),
        ("Computer startup — Freesound 572773 CC0", "computer-startup.mp3", 4, 255, .72),
    )
    for name, filename, channel, frame, volume in specs:
        strip = editor.strips.new_sound(name, str(AUDIO / filename), channel=channel, frame_start=frame)
        strip.volume = volume
    scene.audio_volume = .9


def configure_scene():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 854
    scene.render.resolution_y = 480
    scene.render.resolution_percentage = 100
    scene.render.fps = 24
    scene.render.fps_base = 1
    scene.frame_start = 1
    scene.frame_end = 336
    scene.view_settings.look = "AgX - Medium High Contrast"
    OUTPUT_FRAMES.mkdir(parents=True, exist_ok=True)
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.color_depth = "8"
    scene.render.image_settings.compression = 45
    scene.render.filepath = str(OUTPUT_FRAMES / "frame_")
    scene.render.film_transparent = False
    scene["preview_status"] = "Animated 480p review copy; not integrated into the public game"
    scene["preview_duration_seconds"] = 14
    scene["preview_fps"] = 24
    scene["public_cinematic_replaced"] = False


def main():
    configure_scene()
    make_panorama()
    import_laptop()
    animate_door_and_hand()
    animate_chair()
    animate_camera()
    improve_lighting()
    add_audio()
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    print(f"ANIMATION_BLEND_READY {OUTPUT_BLEND}")
    if "--render-preview" in __import__("sys").argv:
        bpy.ops.render.render(animation=True)
        print(f"ANIMATION_VIDEO_READY {OUTPUT_VIDEO}")


main()
