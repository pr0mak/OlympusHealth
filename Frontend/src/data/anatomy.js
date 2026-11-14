import catalog from './anatomyCatalog.json';
import { muscleGroups } from './muscleGroups.js';

export const MODEL_URL = `${import.meta.env.BASE_URL}models/anatomy/anatomy-male.glb`;
export const ANATOMY_LAYERS = [
  { id: 'muscles', label: 'Muscles' },
  { id: 'skeleton', label: 'Skeleton' },
  { id: 'organs', label: 'Organs' },
];
const anatomyMeshes = catalog
  .filter((part) => part.sex !== 'female' && ANATOMY_LAYERS.some((layer) => layer.id === part.system))
  .sort((a, b) => a.label.localeCompare(b.label));

// Source mesh metadata controls materials and layer visibility.
export const anatomyMeshByKey = Object.fromEntries(anatomyMeshes.map((part) => [part.key, part]));

// Public selection IDs are independent of the GLB's individual muscle meshes.
export const anatomyParts = [
  ...muscleGroups,
  ...anatomyMeshes.filter((part) => part.system !== 'muscles').map((part) => ({ ...part, meshKeys: [part.key] })),
];
export const anatomyByKey = Object.fromEntries(anatomyParts.map((part) => [part.key, part]));
export const selectionByMeshKey = Object.fromEntries(
  anatomyParts.flatMap((part) => part.meshKeys.map((meshKey) => [meshKey, part.key])),
);
