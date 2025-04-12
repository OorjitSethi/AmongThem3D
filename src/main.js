// Import modules
import * as THREE from 'https://cdn.skypack.dev/three@0.136.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/PointerLockControls.js';
import * as CANNON from '../node_modules/cannon-es/dist/cannon-es.js';

// Import our custom modules
import { createMaterials, loadMaterialTextures } from './materials.js';
import { 
    initPhysics, 
    createPhysicsFloor, 
    cannonDebugger, 
    COLLISION_GROUPS 
} from './physics.js';
import { createPlayer, updatePlayerMovement } from './player.js';
import { createSkeldMap } from './map.js';
import { keyboard, setupKeyboardListeners } from './input.js';
import { setupDebugger, checkIfGrounded } from './utils.js';

// Global variables
let camera, scene, renderer, controls;
let world;
let playerBody;
let meshPhysicsPairs = [];
let lastTime = null;
let isGrounded = false;

// Game parameters
const moveSpeed = 20;
const jumpForce = 400;
const timeStep = 1/60;
const maxSubSteps = 5;

// Initialize game
function initGame() {
    try {
        console.log("Initializing game...");
        
        // Error handler
        window.addEventListener('error', function(event) {
            console.error('Error occurred:', event.error);
            document.body.innerHTML = `<div style="color: red; padding: 20px;">
                <h2>Error loading game:</h2>
                <pre>${event.error.stack || event.error}</pre>
            </div>`;
        });

        // Setup keyboard controls
        setupKeyboardListeners();

        // Initialize physics
        world = initPhysics();
        
        // Scene setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000510); // Dark space background
        
        // Setup debug tools
        setupDebugger(scene, world);
        
        // Load materials
        const materials = createMaterials(world);
        
        // Camera setup
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.y = 1.6; // Approximate eye height
        camera.position.z = 5; // Start a bit back from the center
        
        // Renderer setup
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        document.body.appendChild(renderer.domElement);
        
        // Pointer lock controls
        controls = new PointerLockControls(camera, document.body);
        
        // Click event to lock pointer
        document.addEventListener('click', () => {
            controls.lock();
        });
        
        // Create player
        playerBody = createPlayer(world, scene, materials.playerMaterial, meshPhysicsPairs, COLLISION_GROUPS);
        
        // Create floor
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            materials.floorMaterial3js
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);
        
        // Add floor physics
        const floorBody = createPhysicsFloor(world, materials.floorMaterial, COLLISION_GROUPS);
        
        // Create The Skeld map
        createSkeldMap(scene, world, materials, meshPhysicsPairs, COLLISION_GROUPS);
        
        // Lighting setup
        setupLighting(scene);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Start animation loop
        animate();
        
        console.log("Game initialized successfully");
    } catch (error) {
        // Display any errors on the page
        console.error('Initialization error:', error);
        document.getElementById('error-container').style.display = 'block';
        document.getElementById('error-container').innerHTML = `
            <h2>Error initializing game:</h2>
            <pre>${error.stack || error}</pre>
            <p>Please check your browser console for more details.</p>
        `;
    }
}

// Setup lighting
function setupLighting(scene) {
    const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.5);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);
    
    // Add some point lights for better room illumination
    const pointLight1 = new THREE.PointLight(0xFFFFFF, 0.8, 20);
    pointLight1.position.set(5, 3, 5);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xFFFFFF, 0.8, 20);
    pointLight2.position.set(15, 3, 15);
    scene.add(pointLight2);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const now = Date.now();
    const deltaTime = Math.min((now - (lastTime || now)) / 1000, 0.1); // Convert to seconds and cap at 100ms
    lastTime = now;
    
    // Step the physics world with proper substeps
    world.step(timeStep, deltaTime, maxSubSteps);
    
    // Update debug renderer
    if (cannonDebugger) {
        cannonDebugger.update();
    }
    
    // Synchronize meshes with physics bodies
    for(let i = 0; i < meshPhysicsPairs.length; i++) {
        const pair = meshPhysicsPairs[i];
        pair.mesh.position.copy(pair.body.position);
        pair.mesh.quaternion.copy(pair.body.quaternion);
    }
    
    // Check if player is grounded
    isGrounded = checkIfGrounded(world, playerBody);
    
    // Update player movement
    updatePlayerMovement(playerBody, camera, keyboard, isGrounded, moveSpeed, jumpForce, timeStep);
    
    // Update camera position to match physics body
    camera.position.copy(playerBody.position);
    
    renderer.render(scene, camera);
}

// Start the game
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Pre-check to ensure WebGL is working
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            throw new Error('WebGL not supported');
        }
        
        initGame();
    } catch (error) {
        console.error('WebGL test failed:', error);
        document.getElementById('error-container').style.display = 'block';
        document.getElementById('error-container').innerHTML = `
            <h2>WebGL Error</h2>
            <p>Your browser doesn't support WebGL or it's disabled.</p>
            <p>Error: ${error.message}</p>
            <p>Please enable WebGL or try a different browser.</p>
        `;
    }
});

export { scene, world, meshPhysicsPairs }; 