// Selection regions only: original mesh names and geometry remain unchanged.
// Left/right always refer to the anatomical body's left/right.
const region = (key, label, meshKeys) => ({
  key,
  label,
  system: "muscles",
  category: "Musculoskeletal",
  meshKeys,
});

export const muscleGroups = [
  region("left_arm", "Left arm", [
    "deltoid_l",
    "shoulder_muscles_l",
    "rotator_cuff_l",
    "upper_arm_muscles_l",
    "forearm_muscles_l",
    "hand_muscles_l",
  ]),
  region("right_arm", "Right arm", [
    "deltoid_r",
    "shoulder_muscles_r",
    "rotator_cuff_r",
    "upper_arm_muscles_r",
    "forearm_muscles_r",
    "hand_muscles_r",
  ]),
  region("chest", "Chest", [
    "chest_muscles_l",
    "chest_muscles_r",
    "intercostals_l",
    "intercostals_r",
  ]),
  region("back", "Back", [
    "back_muscles_l",
    "back_muscles_r",
    "trapezius_l",
    "trapezius_r",
  ]),
  region("abdominals", "Abdominals", ["abdominal_muscles"]),
  region("left_upper_leg", "Left leg above the knee", [
    "quadriceps_l",
    "hamstrings_l",
    "adductors_l",
    "iliopsoas_l",
    "gluteal_l",
  ]),
  region("right_upper_leg", "Right leg above the knee", [
    "quadriceps_r",
    "hamstrings_r",
    "adductors_r",
    "iliopsoas_r",
    "gluteal_r",
  ]),
  region("left_lower_leg", "Left leg below the knee", [
    "calf_l",
    "shin_muscles_l",
    "foot_muscles_l",
  ]),
  region("right_lower_leg", "Right leg below the knee", [
    "calf_r",
    "shin_muscles_r",
    "foot_muscles_r",
  ]),
  region("neck", "Neck", ["neck_muscles_l", "neck_muscles_r"]),
];

// These structures provide visual context but are not selectable in Muscles.
export const ungroupedMuscleKeys = [
  "diaphragm",
  "pelvic_floor",
];
