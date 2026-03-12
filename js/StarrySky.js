import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Rest of your code stays the same...
// (container check, scene, camera at (0,0,0), renderer, lights, debug box, loader.load('./models/Stars.glb', ...), animate loop, resize)
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('container3D');
    if (!container) {
        console.error('ERROR: #container3D not found in HTML!');
        return;
    }

    let scene, camera, renderer, model;

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);

    // Camera (center = inside the sphere)
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 5000);
    camera.position.set(0, 0, 1000);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 1.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.8);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    // Debug red box (remove after stars appear)
    const debugBox = new THREE.Mesh(
        new THREE.BoxGeometry(8, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    scene.add(debugBox);
    console.log('✅ Debug red box added — you should see a small red cube at center');
    // Full-screen gradient plane (behind stars)
    
    // Load your Stars model
    const loader = new GLTFLoader();
    loader.load(
        './models/Stars.glb',           // ← you said path is correct
        (gltf) => {
            console.log('✅ MODEL LOADED SUCCESSFULLY!', gltf);
            model = gltf.scene;
            scene.add(model);

            model.position.set(0, 0, 0);
            model.scale.set(250, 250, 250);   // huge so you are inside

            // Inward-facing fix
            model.traverse((child) => {
                if (child.isMesh) {
                    child.material.side = THREE.DoubleSide;
                }
            });

            console.log('✅ Stars scaled + inward faces enabled');
        },
        (xhr) => {
            console.log(Math.round((xhr.loaded / xhr.total) * 100) + '% loaded');
        },
        (error) => {
            console.error('❌ MODEL LOAD FAILED:', error.message || error);
        }
    );

    // Auto-rotate (watch the stars)
    function animate() {
        requestAnimationFrame(animate);
        if (model) {
            model.rotation.y -= 0.00015;
            model.rotation.x -= 0.00015;
        }
        renderer.render(scene, camera);
    }
    animate();

    // Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});