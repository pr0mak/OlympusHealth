import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { CameraControls, CameraControlsImpl, useGLTF } from '@react-three/drei';
import { Box3, DoubleSide, MeshStandardMaterial, Raycaster, Vector2 } from 'three';
import { anatomyByKey, anatomyMeshByKey, selectionByMeshKey, MODEL_URL } from '../../data/anatomy.js';
import { configureHomeView, recenterAtHomeScale } from './cameraConstraints.js';

const { ACTION } = CameraControlsImpl;
const mouseButtons = { left: ACTION.ROTATE, middle: ACTION.NONE, right: ACTION.NONE, wheel: ACTION.DOLLY };
const touches = { one: ACTION.TOUCH_ROTATE, two: ACTION.TOUCH_DOLLY, three: ACTION.NONE };

export default function AnatomyScene({ layer, selected, isolate, resetVersion, controlsRef, onSelect, onHover, onReady }) {
  // Meshopt is bundled with the loader: no external decoder or model CDN is needed.
  const { scene } = useGLTF(MODEL_URL, false, true);
  const { camera, gl, invalidate, size } = useThree();
  const [hovered, setHovered] = useState(null);
  const homeViewRef = useRef(null);
  const recenterHome = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (recenterAtHomeScale(controls, homeViewRef.current, smooth)) invalidate();
  }, [controlsRef, invalidate]);
  const { root, meshes, selectionMeshes, fullBounds } = useMemo(() => {
    // Clone the scene and own its materials; do not mutate useGLTF's cached scene.
    const root = scene.clone(true);
    const meshes = new Map();
    const selectionMeshes = new Map();
    root.traverse((object) => {
      if (!object.isMesh) return;
      const info = anatomyMeshByKey[object.name];
      object.material = new MeshStandardMaterial({
        color: info?.color ?? '#d7d1bd',
        roughness: 0.55,
        metalness: 0.02,
        side: DoubleSide,
      });
      const selectionKey = selectionByMeshKey[object.name] ?? null;
      object.userData.selectionKey = selectionKey;
      meshes.set(object.name, object);
      if (selectionKey) {
        if (!selectionMeshes.has(selectionKey)) selectionMeshes.set(selectionKey, []);
        selectionMeshes.get(selectionKey).push(object);
      }
    });
    root.updateMatrixWorld(true);
    return { root, meshes, selectionMeshes, fullBounds: new Box3().setFromObject(root) };
  }, [scene]);

  useEffect(() => {
    // Report selection regions, not individual muscle mesh names, to the UI.
    onReady([...selectionMeshes.keys()]);
    return () => {
      root.traverse((object) => { if (object.isMesh) object.material.dispose(); });
    };
  }, [selectionMeshes, onReady, root]);

  useEffect(() => {
    setHovered(null);
    onHover(null);
  }, [layer, isolate, selected, onHover]);

  useEffect(() => {
    meshes.forEach((mesh, key) => {
      const info = anatomyMeshByKey[key];
      const selectionKey = mesh.userData.selectionKey;
      const isSelected = Boolean(selected) && selectionKey === selected;
      const isHovered = Boolean(hovered) && selectionKey === hovered;
      const primary = info?.system === layer;
      const context = !isolate && info?.system === 'skeleton' && layer !== 'skeleton';
      mesh.visible = isolate ? isSelected : primary || context;
      const material = mesh.material;
      material.transparent = context;
      material.opacity = context ? (layer === 'organs' ? 0.12 : 0.65) : 1;
      material.depthWrite = !context;
      material.emissive.set(isSelected ? '#279c8b' : isHovered ? '#276b63' : '#000000');
      material.emissiveIntensity = isSelected ? 0.55 : 0.35;
      material.needsUpdate = true;
    });
    invalidate();
  }, [hovered, invalidate, isolate, layer, meshes, selected]);

  useEffect(() => {
    const canvas = gl.domElement;
    const raycaster = new Raycaster();
    const pointer = new Vector2();
    const intersections = [];

    function gateWheelZoom(event) {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        pointer.set(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1,
        );
        camera.updateMatrixWorld();
        raycaster.setFromCamera(pointer, camera);

        // Test the geometry at this wheel event, not a stale hover selection.
        // Context bones count as part of the model; hidden layers do not.
        intersections.length = 0;
        for (const mesh of meshes.values()) {
          let visible = true;
          for (let object = mesh; object; object = object.parent) {
            if (!object.visible) { visible = false; break; }
          }
          if (!visible) continue;
          raycaster.intersectObject(mesh, false, intersections);
          if (intersections.length > 0) return;
        }
      }

      // Block CameraControls over empty space while preserving native page scroll.
      event.stopImmediatePropagation();
    }

    canvas.addEventListener('wheel', gateWheelZoom, { capture: true, passive: true });
    return () => canvas.removeEventListener('wheel', gateWheelZoom, true);
  }, [camera, gl, meshes]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const focusedMeshes = selected ? selectionMeshes.get(selected) : null;
    const hasFocus = Boolean(focusedMeshes?.length);
    const firstFrame = homeViewRef.current === null;
    const smooth = !firstFrame && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const home = configureHomeView(controls, fullBounds);
    homeViewRef.current = home;
    // Fit the combined bounds so all parts of a region stay in the focused view.
    const bounds = hasFocus
      ? focusedMeshes.reduce((box, mesh) => box.union(new Box3().setFromObject(mesh)), new Box3())
      : fullBounds;
    if (bounds.isEmpty()) return;
    if (!hasFocus) {
      const { center, distance } = home;
      controls.setLookAt(center.x, center.y, center.z + distance, center.x, center.y, center.z, smooth);
      controls.setFocalOffset(0, 0, 0, smooth);
    } else {
      controls.fitToBox(bounds, smooth, {
        paddingTop: 0.04,
        paddingBottom: 0.04,
        paddingLeft: 0.04,
        paddingRight: 0.04,
      });
    }
    invalidate();
  }, [controlsRef, fullBounds, invalidate, layer, selectionMeshes, resetVersion, selected, size.width, size.height]);

  function getPart(event) {
    // Visible primary-layer geometry blocks clicks through to structures behind it,
    // even when that geometry is context-only (for example, ungrouped back muscles).
    if (anatomyMeshByKey[event.object.name]?.system === layer) event.stopPropagation();
    const part = anatomyByKey[event.object.userData.selectionKey];
    return part?.system === layer ? part : null;
  }

  return (
    <>
      <ambientLight intensity={1.1} />
      <hemisphereLight args={['#e1f3ff', '#39445c', 1.5]} />
      <directionalLight position={[3, 4, 5]} intensity={2.4} />
      <directionalLight position={[-3, 2, -3]} color="#a6d3ff" intensity={1.8} />
      <primitive object={root} dispose={null}
        onPointerMove={(event) => {
          const part = getPart(event);
          if (!part) {
            setHovered(null);
            onHover(null);
            return;
          }
          event.stopPropagation();
          setHovered(part.key);
          onHover(part.label);
        }}
        onPointerOut={() => { setHovered(null); onHover(null); }}
        onClick={(event) => {
          const part = getPart(event);
          if (!part || event.delta > 5) return;
          event.stopPropagation();
          onSelect(part.key);
        }}
      />
      <CameraControls ref={controlsRef} makeDefault dollyToCursor
        mouseButtons={mouseButtons} touches={touches} infinityDolly={false} onRest={recenterHome}
        minPolarAngle={Math.PI / 2} maxPolarAngle={Math.PI / 2} polarRotateSpeed={0}
        minDistance={0.08} smoothTime={0.3} draggingSmoothTime={0.12} />
    </>
  );
}
