import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Box3, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { muscleGroups, ungroupedMuscleKeys } from "../src/data/muscleGroups.js";

const asset = new URL(
  "../public/models/anatomy/anatomy-male.glb",
  import.meta.url,
);
const bytes = await readFile(asset);
assert.equal(
  createHash("sha256").update(bytes).digest("hex"),
  "25248bef02f0ca43eedbd25231f8b6f9681865a57016f9d5e352d407407336c7",
  "Model differs from the pinned source asset.",
);

const catalog = JSON.parse(
  await readFile(
    new URL("../src/data/anatomyCatalog.json", import.meta.url),
    "utf8",
  ),
);
const byKey = new Map(catalog.map((part) => [part.key, part]));
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const { scene } = await loader.parseAsync(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  "",
);
scene.updateMatrixWorld(true);

const counts = {};
const meshNames = new Set();
scene.traverse((object) => {
  if (!object.isMesh) return;
  // GLTFLoader makes the skin mesh name unique from its parent group named skin.
  const key = object.name === "skin_1" ? "skin" : object.name;
  assert(byKey.has(key), `Missing catalog metadata for ${object.name}.`);
  assert(!meshNames.has(key), `Duplicate mesh key ${key}.`);
  meshNames.add(key);
  const system = byKey.get(key).system;
  counts[system] = (counts[system] ?? 0) + 1;
  const bounds = new Box3().setFromObject(object);
  assert(!bounds.isEmpty(), `Empty geometry for ${object.name}.`);
  assert(
    [...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite),
    `Invalid bounds for ${object.name}.`,
  );
});

assert.equal(meshNames.size, 128);
for (const key of [
  "heart",
  "brain",
  "lung_l",
  "lung_r",
  "liver",
  "kidney_l",
  "kidney_r",
  "femur_l",
  "pelvis",
  "spine_lumbar",
  "quadriceps_l",
  "calf_l",
]) {
  assert(meshNames.has(key), `Required selectable structure missing: ${key}.`);
}
const size = new Box3().setFromObject(scene).getSize(new Vector3());
assert(size.y > 1.4 && size.y < 2.3, "Expected full-body height in metres.");
for (const notice of ["LICENSE-MODELS.md", "ATTRIBUTION.md", "SOURCE.md"]) {
  assert(
    (
      await readFile(
        new URL(`../public/models/anatomy/${notice}`, import.meta.url),
        "utf8",
      )
    ).length > 100,
    `Missing asset notice ${notice}.`,
  );
}
assert.equal(
  muscleGroups.length,
  9,
  "Expected exactly nine selectable muscle regions.",
);
assert.equal(
  new Set(muscleGroups.map((group) => group.key)).size,
  9,
  "Region IDs must be unique.",
);
const groupedMeshKeys = new Set();
for (const group of muscleGroups) {
  assert(group.meshKeys.length > 0, `Empty muscle group: ${group.key}.`);
  for (const key of group.meshKeys) {
    assert(
      meshNames.has(key),
      `Group ${group.key} references missing mesh ${key}.`,
    );
    assert.equal(
      byKey.get(key).system,
      "muscles",
      `Group ${group.key} contains a non-muscle mesh.`,
    );
    assert(
      !groupedMeshKeys.has(key),
      `Muscle ${key} belongs to multiple selection regions.`,
    );
    if (group.key.startsWith("left_"))
      assert(
        key.endsWith("_l"),
        `Wrong anatomical side for ${group.key}: ${key}.`,
      );
    if (group.key.startsWith("right_"))
      assert(
        key.endsWith("_r"),
        `Wrong anatomical side for ${group.key}: ${key}.`,
      );
    groupedMeshKeys.add(key);
  }
  const bounds = group.meshKeys.reduce(
    (box, key) =>
      box.union(new Box3().setFromObject(scene.getObjectByName(key))),
    new Box3(),
  );
  assert(!bounds.isEmpty(), `Cannot frame muscle region ${group.key}.`);
}
const contextMuscles = new Set(ungroupedMuscleKeys);
assert.equal(contextMuscles.size, ungroupedMuscleKeys.length);
for (const key of contextMuscles) {
  assert(
    meshNames.has(key) && byKey.get(key).system === "muscles",
    `Invalid context-only muscle: ${key}.`,
  );
  assert(
    !groupedMeshKeys.has(key),
    `Context muscle ${key} must not be selectable.`,
  );
}
for (const key of meshNames) {
  if (byKey.get(key).system === "muscles")
    assert(
      groupedMeshKeys.has(key) || contextMuscles.has(key),
      `Unclassified muscle ${key}.`,
    );
}
console.log(
  "Anatomy asset verified: Meshopt decode, 128 unique source meshes, finite bounds, core structures, checksum, and notices.",
);
console.log(
  `Muscle selection verified: 9 regions, ${groupedMeshKeys.size} member meshes, ${contextMuscles.size} context-only meshes, correct sides, no overlaps.`,
);
console.log("Meshes per system:", counts);
console.log(
  "Body dimensions (metres):",
  size
    .toArray()
    .map((value) => value.toFixed(3))
    .join(" × "),
);
