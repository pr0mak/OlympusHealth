// Illustrative region fixtures only; not clinical assessments or combined measurements.
const status = (density, structure, strength, formation, breakdown) => ({
  density, structure, strength, formation, breakdown,
});

export const mockBoneStatus = {
  skeleton_right_arm: status(1.034, 8, 9, 6, 4),
  skeleton_left_arm: status(1.018, 8, 8, 6, 4),
  skeleton_right_leg: status(1.168, 9, 9, 7, 4),
  skeleton_left_leg: status(1.152, 8, 9, 7, 5),
  pelvis: status(1.112, 8, 9, 7, 5),
  spine: status(1.084, 7, 8, 6, 5),
  ribs: status(0.842, 8, 7, 5, 4),
  skull: status(1.245, 9, 9, 4, 3),
};
