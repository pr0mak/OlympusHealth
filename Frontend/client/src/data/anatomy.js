import catalog from "./anatomyCatalog.json";
import { muscleGroups } from "./muscleGroups.js";
import { boneGroups } from "./boneGroups.js";

export const ANATOMY_LAYERS = [
  { id: "muscles", label: "Muscles" },
  { id: "skeleton", label: "Skeleton" },
  { id: "organs", label: "Organs" },
];

function createAnatomy(sex) {
  const meshes = catalog
    .filter(part => (!part.sex || part.sex === sex)
      && ANATOMY_LAYERS.some(layer => layer.id === part.system))
    .sort((a, b) => a.label.localeCompare(b.label));
  // Shared muscle and bone regions work with both source models.
  const parts = [
    ...muscleGroups,
    ...boneGroups,
    ...meshes
      .filter(part => part.system === "organs")
      .map(part => ({ ...part, meshKeys: [part.key] })),
  ];

  return {
    sex,
    modelUrl: `${import.meta.env.BASE_URL}models/anatomy/anatomy-${sex}.glb`,
    meshByKey: Object.fromEntries(meshes.map(part => [part.key, part])),
    parts,
    byKey: Object.fromEntries(parts.map(part => [part.key, part])),
    selectionByMeshKey: Object.fromEntries(parts.flatMap(part =>
      part.meshKeys.map(meshKey => [meshKey, part.key]))),
  };
}

const variants = { male: createAnatomy("male"), female: createAnatomy("female") };

export function getAnatomy(gender) {
  return gender === "female" ? variants.female : variants.male;
}
