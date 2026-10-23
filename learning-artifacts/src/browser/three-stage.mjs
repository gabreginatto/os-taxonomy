import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function createThreeStage(root, kind, options = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0xe7eee6, 1);
  root.replaceChildren(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', kind === 'daynight' ? 'Earth with an observer and sunlight' : 'Rotatable solid shape');
  renderer.domElement.setAttribute('role', 'img');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
  camera.position.set(3.8, 2.4, 5.4); camera.lookAt(kind === 'daynight' ? .9 : 0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x64786a, kind === 'daynight' ? .18 : 2.1));
  const light = new THREE.DirectionalLight(0xfff3d7, kind === 'daynight' ? 3 : 2.4);
  light.position.set(6, kind === 'daynight' ? 0 : 5, 0); scene.add(light);
  const group = new THREE.Group(); scene.add(group);
  const geometry = new THREE.SphereGeometry(1, 36, 24);
  const material = new THREE.MeshStandardMaterial({color:0x168d8a,roughness:.7});
  const globe = new THREE.Mesh(geometry, material);
  const cube = new THREE.Mesh(new THREE.BoxGeometry(1.6,1.6,1.6),new THREE.MeshStandardMaterial({color:0xe9aa45,roughness:.7}));
  group.add(globe, cube);
  let marker;
  if (kind === 'daynight') {
    cube.visible = false;
    const grid = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(1.004,16,8)), new THREE.LineBasicMaterial({color:0x96d5bd,transparent:true,opacity:.32}));
    group.add(grid);
    marker = new THREE.Mesh(new THREE.SphereGeometry(.075,12,8),new THREE.MeshBasicMaterial({color:0xf9d95b}));
    marker.position.set(1.06,0,0); group.add(marker);
    const sun = new THREE.Mesh(new THREE.SphereGeometry(.38,24,16),new THREE.MeshBasicMaterial({color:0xf2bb53}));
    sun.position.set(3.2,0,0); scene.add(sun);
  }
  let external = null;
  if (options.asset) {
    external = (await new GLTFLoader().loadAsync(options.asset)).scene;
    group.add(external); globe.visible = cube.visible = false;
  }
  function resize() {
    const width = Math.max(root.clientWidth, 1), height = Math.max(root.clientHeight, 1);
    renderer.setSize(width,height,false); camera.aspect = width/height; camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(() => { resize(); renderer.render(scene,camera); }); observer.observe(root);
  resize();
  return {
    render(o) {
      group.rotation.y = (o.rotation || 0)*Math.PI/180;
      if (kind === 'shapes' && !external) { cube.visible = o.shape === 'cube'; globe.visible = o.shape === 'sphere'; }
      renderer.render(scene,camera);
    },
    dispose() { observer.disconnect(); scene.traverse(o => { o.geometry?.dispose(); if(o.material) for(const m of Array.isArray(o.material)?o.material:[o.material]) m.dispose(); }); renderer.dispose(); },
    info: { renderer: 'threejs', external_asset_loaded: Boolean(external), triangles_budget: 100000 }
  };
}
