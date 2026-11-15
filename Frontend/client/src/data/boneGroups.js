// Selection regions only; preserve the source meshes and geometry.
// Anatomical left/right match the existing muscle groups. Prefix limb IDs
// so bone and muscle selections can coexist in the same anatomy lookup.
const region = (key, label, meshKeys) => ({
  key,
  label,
  system: "skeleton",
  category: "Musculoskeletal",
  meshKeys,
});

export const boneGroups = [
  region("skeleton_right_arm", "Right arm", [
    "clavicle_r", "scapula_r", "humerus_r", "forearm_r", "hand_r",
  ]),
  region("skeleton_left_arm", "Left arm", [
    "clavicle_l", "scapula_l", "humerus_l", "forearm_l", "hand_l",
  ]),
  region("skeleton_right_leg", "Right leg", [
    "femur_r", "patella_r", "lower_leg_r", "foot_r",
  ]),
  region("skeleton_left_leg", "Left leg", [
    "femur_l", "patella_l", "lower_leg_l", "foot_l",
  ]),
  region("pelvis", "Pelvis & Sacrum", ["pelvis"]),
  region("spine", "Spine", ["spine_cervical", "spine_thoracic", "spine_lumbar"]),
  region("ribs", "Ribs", ["ribs_l", "ribs_r", "sternum"]),
  region("skull", "Skull", ["skull", "mandible", "teeth"]),
];
