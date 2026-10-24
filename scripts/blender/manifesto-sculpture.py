"""Build the APAR Manifesto sculpture as an editable Blender source and compact GLB."""

import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
MODEL = ROOT / "public/models/apar-manifesto-sculpture.glb"
STILL = ROOT / "public/models/apar-manifesto-sculpture.png"
SOURCE = ROOT / "design-source/blender/apar-manifesto-sculpture.blend"
for path in (MODEL, SOURCE):
    path.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.name = "APAR Manifesto / An idea takes shape"
collection = bpy.data.collections.new("APAR / Sculptural ribbon")
scene.collection.children.link(collection)


def material(name, color, metallic, roughness):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = next(node for node in mat.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


coral = material("APAR vermilion / satin enamel", (0.91, 0.091, 0.052), 0.32, 0.27)
peach = material("Warm cut edge", (1.0, 0.52, 0.37), 0.45, 0.21)
dark = material("Inner oxblood", (0.27, 0.065, 0.052), 0.33, 0.33)

# A continuous Möbius ribbon: one surface moves through three dimensions,
# echoing the manifesto's idea -> identity -> experience progression.
segments, strips = 192, 12
vertices, faces = [], []
for i in range(segments):
    u = i * 2 * math.pi / segments
    for j in range(strips + 1):
        v = (j / strips - 0.5) * 0.73
        r = 1.22 + v * math.cos(u / 2)
        vertices.append((r * math.cos(u), r * math.sin(u), v * math.sin(u / 2)))
for i in range(segments):
    for j in range(strips):
        a = i * (strips + 1) + j
        b = i * (strips + 1) + j + 1
        if i == segments - 1:
            c = strips - j
            d = strips - j - 1
        else:
            c = (i + 1) * (strips + 1) + j
            d = c + 1
        faces.append((a, c, d, b))

mesh = bpy.data.meshes.new("Continuous ribbon mesh")
mesh.from_pydata(vertices, [], faces)
mesh.update()
sculpture = bpy.data.objects.new("APAR / Endless idea", mesh)
collection.objects.link(sculpture)
sculpture.data.materials.append(coral)
sculpture.data.materials.append(dark)
for polygon in mesh.polygons:
    polygon.use_smooth = True
    if polygon.index // strips >= segments // 2:
        polygon.material_index = 1

solid = sculpture.modifiers.new("Fine sculptural thickness", "SOLIDIFY")
solid.thickness = 0.055
solid.offset = 0
bevel = sculpture.modifiers.new("Soft light-catching lip", "BEVEL")
bevel.width = 0.017
bevel.segments = 2
bevel.affect = "EDGES"
normal = sculpture.modifiers.new("Weighted edge normals", "WEIGHTED_NORMAL")
bpy.context.view_layer.objects.active = sculpture
sculpture.select_set(True)
for modifier in tuple(sculpture.modifiers):
    bpy.ops.object.modifier_apply(modifier=modifier.name)
sculpture.select_set(False)

# A single open elliptical arc gives the sculpture a clear silhouette without
# shipping textures or a second high-polygon hero scene.
arc_points = []
for i in range(100):
    t = -0.15 * math.pi + i / 99 * 1.39 * math.pi
    arc_points.append(Vector((1.67 * math.cos(t), 1.67 * math.sin(t), -0.19 + 0.14 * math.sin(t * 1.5))))
curve = bpy.data.curves.new("Orbit filament curve", "CURVE")
curve.dimensions = "3D"
curve.bevel_depth = 0.012
curve.bevel_resolution = 2
spline = curve.splines.new("POLY")
spline.points.add(len(arc_points) - 1)
for point, pos in zip(spline.points, arc_points):
    point.co = (*pos, 1)
filament = bpy.data.objects.new("APAR / Orbit filament", curve)
collection.objects.link(filament)
filament.data.materials.append(peach)
bpy.ops.object.select_all(action="DESELECT")
filament.select_set(True)
bpy.context.view_layer.objects.active = filament
bpy.ops.object.convert(target="MESH")
filament = bpy.context.view_layer.objects.active
filament.select_set(False)

for obj in (sculpture, filament):
    obj.select_set(True)
bpy.context.view_layer.objects.active = sculpture
bpy.ops.export_scene.gltf(
    filepath=str(MODEL),
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
)
bpy.ops.object.select_all(action="DESELECT")

def area(name, location, power, size, color):
    data = bpy.data.lights.new(name, "AREA")
    data.energy, data.shape, data.size, data.color = power, "DISK", size, color
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector((0, 0, 0)) - obj.location).to_track_quat("-Z", "Y").to_euler()


area("Softbox / warm key", (0, -4, 5), 620, 4.2, (1, 0.76, 0.62))
area("Softbox / coral rim", (2, 2, 3), 490, 3, (1, 0.27, 0.17))
area("Softbox / pale fill", (-3, 1, 2), 380, 3, (1, 0.92, 0.84))
camera_data = bpy.data.cameras.new("Manifesto / orthographic camera")
camera = bpy.data.objects.new("Manifesto / orthographic camera", camera_data)
scene.collection.objects.link(camera)
camera.location = (3, -4.8, 2.9)
camera.rotation_euler = (Vector((0, 0, 0)) - camera.location).to_track_quat("-Z", "Y").to_euler()
camera_data.type = "ORTHO"
camera_data.ortho_scale = 4.25
scene.camera = camera
scene.render.engine = "CYCLES"
scene.cycles.samples = 32
scene.render.resolution_x = 840
scene.render.resolution_y = 840
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = str(STILL)
scene.world.color = (0.35, 0.35, 0.35)
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE))
bpy.ops.render.render(write_still=True)
print(f"source={SOURCE} model={MODEL} still={STILL}")
