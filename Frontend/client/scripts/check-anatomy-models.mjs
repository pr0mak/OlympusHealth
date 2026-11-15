import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";
import { Box3, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { muscleGroups } from "../src/data/muscleGroups.js";
import { mockOrganStatus } from "../src/data/mockOrganStatus.js";

const models = [
  { sex: "male", meshes: 128, hash: "25248bef02f0ca43eedbd25231f8b6f9681865a57016f9d5e352d407407336c7" },
  { sex: "female", meshes: 133, hash: "2eee011f8cb7a189af0757f5e287754e84276dd084faeb2daca45572942f4ce2" },
];
const catalog = JSON.parse(await readFile(new URL("../src/data/anatomyCatalog.json", import.meta.url), "utf8"));
const catalogByKey = Object.fromEntries(catalog.map(part => [part.key, part]));
const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });

try {
  const { getAnatomy } = await server.ssrLoadModule("/src/data/anatomy.js");
  assert.equal(getAnatomy(undefined).sex, "male", "Keep the anonymous default.");
  for (const model of models) {
    const anatomy = getAnatomy(model.sex);
    assert.equal(anatomy.sex, model.sex);
    assert(anatomy.modelUrl.endsWith(`/anatomy-${model.sex}.glb`));

    const bytes = await readFile(new URL(`../public/models/anatomy/anatomy-${model.sex}.glb`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), model.hash);
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const { scene } = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
    scene.updateMatrixWorld(true);
    const meshes = new Map();
    scene.traverse(object => {
      if (!object.isMesh) return;
      const key = object.name === "skin_1" ? "skin" : object.name;
      assert(!meshes.has(key), `Duplicate ${model.sex} mesh: ${key}`);
      meshes.set(key, object);
      const info = catalogByKey[key];
      assert(info, `Missing catalog entry: ${model.sex}/${key}`);
      assert(!info.sex || info.sex === model.sex, `Wrong anatomy: ${model.sex}/${key}`);
      const bounds = new Box3().setFromObject(object);
      assert(!bounds.isEmpty());
      assert([...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite));
    });
    assert.equal(meshes.size, model.meshes);
    const size = new Box3().setFromObject(scene).getSize(new Vector3());
    assert(size.y > 1.4 && size.y < 2.3, "Expected a full-body model in metres.");

    // Verify every visible mesh, hover label and click/zoom region uses this model.
    for (const key of Object.keys(anatomy.meshByKey)) {
      assert(meshes.has(key), `Visible metadata references a missing mesh: ${model.sex}/${key}`);
    }
    for (const part of anatomy.parts) {
      assert(!part.sex || part.sex === model.sex);
      const bounds = new Box3();
      for (const key of part.meshKeys) {
        assert(meshes.has(key), `Missing focus mesh: ${model.sex}/${key}`);
        assert.equal(anatomy.selectionByMeshKey[key], part.key);
        bounds.union(new Box3().setFromObject(meshes.get(key)));
      }
      assert(!bounds.isEmpty(), `Cannot frame ${model.sex}/${part.key}`);
      if (part.system === "organs") assert(mockOrganStatus[part.key], `Missing organ panel: ${part.key}`);
    }
    for (const group of muscleGroups) assert(anatomy.byKey[group.key]);
    for (const part of catalog.filter(part => part.sex)) {
      assert.equal(Boolean(anatomy.byKey[part.key]), part.sex === model.sex,
        `Sex-specific selection mismatch: ${model.sex}/${part.key}`);
    }
    const organCount = anatomy.parts.filter(part => part.system === "organs").length;
    assert.deepEqual(anatomy.byKey.back.meshKeys, ["back_muscles_l", "back_muscles_r", "trapezius_l", "trapezius_r"]);
    console.log(`${model.sex}: checksum, ${meshes.size} decoded meshes, ${muscleGroups.length} muscle regions, ${organCount} organ panels, click bounds and model routing verified.`);
  }
} finally {
  await server.close();
}
