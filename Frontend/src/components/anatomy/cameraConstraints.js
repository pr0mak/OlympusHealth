import { Spherical, Vector3 } from 'three';

export function configureHomeView(controls, bounds) {
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());
  // Match the full-body framing margins, using this viewport's actual aspect ratio.
  const distance = controls.getDistanceToFitBox(size.x + 0.2, size.y + 0.12, size.z);
  controls.maxDistance = distance;
  if (controls.distance > distance) controls.distance = distance;
  return { center, distance };
}

export function recenterAtHomeScale(controls, home, smooth = true) {
  if (!home) return false;
  const desiredDistance = controls.getSpherical(new Spherical(), true).radius;
  if (desiredDistance < home.distance - 0.0001) return false;
  const target = controls.getTarget(new Vector3(), true);
  if (target.distanceToSquared(home.center) < 0.00000001) return false;
  // Translate camera and orbit target together, preserving the current rotation.
  controls.moveTo(home.center.x, home.center.y, home.center.z, smooth);
  return true;
}
