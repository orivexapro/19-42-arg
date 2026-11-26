"""Export complete appendable collection assets, including hierarchy, maps and actions."""
from pathlib import Path
import bpy
out=Path(bpy.data.filepath).parent
objects=bpy.data.objects
components={
    'Braise — siège mobile':['ASSET_modern_arm_chair_01'],
    'Braise — table':['ASSET_WoodenTable_01'],
    'Braise — liseuse':['ASSET_industrial_pipe_lamp'],
    'Braise — poste ArchiveOS':['ASSET_CC0_Innerscene_Laptop','Interrupteur • course 2 mm','Souris • coque graphite','Molette'],
    'Braise — main et manche':['Journalist_Right_Hand_Rig'],
    'Braise — porte':['Door_Pivot'],
    'Braise — éclairage':[o.name for o in objects if o.type=='LIGHT'],
    'Braise — Paris animé':['Paris_Panorama_Original'],
}
assets=set()
for label,roots in components.items():
    c=bpy.data.collections.new(label)
    for name in roots:
        root=objects[name]
        for o in (root,*root.children_recursive):
            if o.name not in c.objects:c.objects.link(o)
    c.asset_mark()
    c.asset_data.description='19:41 • éléments de la copie de revue. Animation en coordonnées de la scène à 30 i/s.'
    c.use_fake_user=True
    assets.add(c)
for name in ('Porcelaine • profil laqué','Sol • linoléum bleu grisé','Sergé • encre','Dalle • ArchiveOS'):
    m=bpy.data.materials[name];m.asset_mark();assets.add(m)
bpy.data.libraries.write(str(out/'19-41_bibliotheque_braise.blend'),assets,path_remap='RELATIVE',fake_user=True,compress=True)
