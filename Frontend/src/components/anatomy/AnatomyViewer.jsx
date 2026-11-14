import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, useProgress } from '@react-three/drei';
import { ANATOMY_LAYERS, anatomyByKey, anatomyParts, MODEL_URL } from '../../data/anatomy.js';
import AnatomyScene from './AnatomyScene.jsx';
import ViewerErrorBoundary from './ViewerErrorBoundary.jsx';
import '../../styles/anatomy.css';

export default function AnatomyViewer({ onSelectionChange }) {
  const [layer, setLayer] = useState('muscles');
  const [selected, setSelected] = useState(null);
  const [hoveredLabel, setHoveredLabel] = useState(null);
  const [isolate, setIsolate] = useState(false);
  const [availableKeys, setAvailableKeys] = useState([]);
  const [resetVersion, setResetVersion] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const controlsRef = useRef(null);
  const viewportRef = useRef(null);
  const { progress } = useProgress();
  const ready = availableKeys.length > 0;
  const options = anatomyParts.filter((part) => part.system === layer && availableKeys.includes(part.key));
  const selectedPart = anatomyByKey[selected];
  const onReady = useCallback((keys) => setAvailableKeys(keys), []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const animation = viewportRef.current?.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });
    return () => animation?.cancel();
  }, [layer]);

  function selectPart(key) {
    setSelected(key || null);
    if (!key) setIsolate(false);
    onSelectionChange?.(anatomyByKey[key] ?? null);
  }

  function resetView() {
    selectPart(null);
    setHoveredLabel(null);
    setResetVersion((version) => version + 1);
  }

  function retry() {
    useGLTF.clear(MODEL_URL);
    setAvailableKeys([]);
    resetView();
    setAttempt((version) => version + 1);
  }

  return (
    <section className="viewer-panel anatomy-viewer" aria-label="Interactive 3D anatomy viewer">
      <header className="anatomy-toolbar">
        <div><p className="eyebrow">Body digital twin</p><h2>Explore your anatomy</h2></div>
        <div className="anatomy-layers" role="group" aria-label="Anatomical layer">
          {ANATOMY_LAYERS.map((item) => <button key={item.id} type="button" aria-pressed={layer === item.id} onClick={() => { setLayer(item.id); resetView(); }}>{item.label}</button>)}
        </div>
      </header>

      <div className="anatomy-selector">
        <label htmlFor="anatomy-structure">Structure</label>
        <select id="anatomy-structure" value={selected ?? ''} disabled={!ready} onChange={(event) => selectPart(event.target.value)}>
          <option value="">Choose a structure or click the model</option>
          {options.map((part) => <option key={part.key} value={part.key}>{part.label}</option>)}
        </select>
      </div>

      <ViewerErrorBoundary key={attempt} onRetry={retry}>
        <div ref={viewportRef} className={`anatomy-viewport${hoveredLabel ? ' anatomy-viewport--hover' : ''}`}>
          <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [0, 1, 3.8], fov: 35, near: 0.01, far: 30 }}
            gl={{ alpha: true, antialias: true }}
            fallback={<span>Interactive 3D anatomy. Use the structure selector to explore with a keyboard.</span>}>
            <Suspense fallback={null}>
              <AnatomyScene layer={layer} selected={selected} isolate={isolate} resetVersion={resetVersion} controlsRef={controlsRef}
                onSelect={selectPart} onHover={setHoveredLabel} onReady={onReady} />
            </Suspense>
          </Canvas>
          {!ready && <div className="anatomy-loading" role="status"><span className="loading-ring" aria-hidden="true" /><p>Loading 3D anatomy… {Math.round(progress)}%</p></div>}
          {hoveredLabel && <span className="anatomy-hover-label" aria-hidden="true">{hoveredLabel}</span>}
        </div>
      </ViewerErrorBoundary>

      <div className="anatomy-selection">
        <div aria-live="polite"><span className="anatomy-selection-label">{selectedPart ? 'Selected structure' : 'Full body view'}</span><strong>{selectedPart?.label ?? 'Select a structure to explore'}</strong></div>
        <label className="isolate-control"><input type="checkbox" checked={isolate} disabled={!selected || !ready} onChange={(event) => setIsolate(event.target.checked)} />Isolate</label>
      </div>
      <footer className="anatomy-controls">
        <span>Drag to rotate · Scroll or pinch to zoom</span>
        <div className="anatomy-camera-buttons">
          <button type="button" aria-label="Zoom out" disabled={!ready} onClick={() => controlsRef.current?.dolly(-0.25, true)}>−</button>
          <button type="button" aria-label="Zoom in" disabled={!ready} onClick={() => controlsRef.current?.dolly(0.25, true)}>+</button>
          <button type="button" disabled={!ready} onClick={resetView}>Reset view</button>
        </div>
      </footer>
      <details className="anatomy-credits"><summary>Model credits &amp; license</summary>
        <p>BodyParts3D © The Database Center for Life Science (CC BY 4.0). Adapted by <a href="https://github.com/MervinR07/open-anatomy-3d" target="_blank" rel="noreferrer">Open Anatomy 3D</a> (CC BY 4.0). Display materials and layer visibility customized for this app.</p>
        <a href={`${import.meta.env.BASE_URL}models/anatomy/ATTRIBUTION.md`} target="_blank" rel="noreferrer">Full credits</a>{' · '}<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0 license</a>
      </details>
    </section>
  );
}
