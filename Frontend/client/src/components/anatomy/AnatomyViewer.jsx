import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, useProgress } from '@react-three/drei';
import { ANATOMY_LAYERS, getAnatomy } from '../../data/anatomy.js';
import AnatomyScene from './AnatomyScene.jsx';
import ViewerErrorBoundary from './ViewerErrorBoundary.jsx';

export default function AnatomyViewer({ onSelectionChange, onModelReady, onModelError, selected = null, gender }) {
  const anatomy = getAnatomy(gender);
  const [layer, setLayer] = useState('muscles');
  const [hoveredLabel, setHoveredLabel] = useState(null);
  const [ready, setReady] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const controlsRef = useRef(null);
  const viewportRef = useRef(null);
  const { progress } = useProgress();
  const onReady = useCallback(() => {
    setReady(true);
    onModelReady?.();
  }, [onModelReady]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const animation = viewportRef.current?.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });
    return () => animation?.cancel();
  }, [layer]);

  function selectPart(key) {
    onSelectionChange?.(anatomy.byKey[key] ?? null);
  }

  function resetView() {
    selectPart(null);
    setHoveredLabel(null);
    setResetVersion((version) => version + 1);
  }

  function retry() {
    useGLTF.clear(anatomy.modelUrl);
    setReady(false);
    resetView();
    setAttempt((version) => version + 1);
  }

  return (
    <section className="anatomy-viewer" data-model-ready={ready} data-model-sex={anatomy.sex} aria-label={`Interactive ${anatomy.sex} 3D anatomy viewer`}>
      <ViewerErrorBoundary key={attempt} onRetry={retry} onError={onModelError}>
        <div id="anatomy-viewport" ref={viewportRef} className={`anatomy-viewport${hoveredLabel ? ' anatomy-viewport--hover' : ''}`}
          tabIndex={0} role="group" aria-label="Anatomy model. Click a region to select it; press Escape to return to the full body."
          onKeyDown={(event) => { if (event.key === 'Escape') resetView(); }}
          onDoubleClick={resetView}>
          <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [0, 1, 3.8], fov: 35, near: 0.01, far: 30 }}
            gl={{ alpha: true, antialias: true }} onPointerMissed={resetView}
            fallback={<span>Interactive 3D anatomy model. Click a region to inspect it.</span>}>
            <Suspense fallback={null}>
              <AnatomyScene anatomy={anatomy} layer={layer} selected={selected} isolate={false} resetVersion={resetVersion} controlsRef={controlsRef}
                onSelect={selectPart} onHover={setHoveredLabel} onReady={onReady} />
            </Suspense>
          </Canvas>
          {!ready && <div className="anatomy-loading" role="status"><span className="loading-ring" aria-hidden="true" /><p>Loading 3D anatomy… {Math.round(progress)}%</p></div>}
          {hoveredLabel && <span className="anatomy-hover-label" aria-hidden="true">{hoveredLabel}</span>}
        </div>
      </ViewerErrorBoundary>

      <div className="anatomy-layers" role="group" aria-label="Anatomical layer">
        {ANATOMY_LAYERS.map((item) => <button key={item.id} type="button" aria-pressed={layer === item.id} onClick={() => { setLayer(item.id); resetView(); }}>{item.label}</button>)}
      </div>
      <span className="visually-hidden" role="status">{selected ? `Selected structure: ${anatomy.byKey[selected]?.label ?? ''}` : ''}</span>
    </section>
  );
}
