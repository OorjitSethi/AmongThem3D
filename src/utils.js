import * as THREE from 'https://cdn.skypack.dev/three@0.136.0/build/three.module.js';
import * as CANNON from '../node_modules/cannon-es/dist/cannon-es.js';
import CannonDebugger from '../node_modules/cannon-es-debugger/dist/cannon-es-debugger.js';

// Global variable for the debugger
let cannonDebugger;

// Setup the CannonDebugger
function setupDebugger(scene, world) {
    cannonDebugger = new CannonDebugger(scene, world);
    console.log("Physics debugger initialized");
    return cannonDebugger;
}

// Check if player is on the ground using raycasting
function checkIfGrounded(world, playerBody) {
    const raycastDistance = 0.5; // How far down to check for ground
    
    // Start slightly inside player's bounding volume
    const start = new CANNON.Vec3(
        playerBody.position.x,
        playerBody.position.y,
        playerBody.position.z
    );
    
    // End below the player, by raycastDistance
    const end = new CANNON.Vec3(
        playerBody.position.x,
        playerBody.position.y - raycastDistance,
        playerBody.position.z
    );
    
    // Do the raycast
    const result = new CANNON.RaycastResult();
    world.raycastClosest(start, end, {
        collisionFilterMask: ~0, // Collide with everything
        skipBackfaces: true
    }, result);
    
    // If we hit something, we're grounded
    return result.hasHit;
}

// Helper to create a combined mesh + physics object
function createWallWithMesh(scene, world, x, y, z, width, height, depth, material, physMaterial, meshPhysicsPairs) {
    // Create visual mesh
    const wallGeometry = new THREE.BoxGeometry(width, height, depth);
    const wallMesh = new THREE.Mesh(wallGeometry, material);
    wallMesh.position.set(x, y + height/2, z);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    scene.add(wallMesh);
    
    // Create physics body
    const halfExtents = new CANNON.Vec3(width/2, height/2, depth/2);
    const boxShape = new CANNON.Box(halfExtents);
    const boxBody = new CANNON.Body({
        mass: 0, // Static body
        position: new CANNON.Vec3(x, y + height/2, z),
        shape: boxShape,
        material: physMaterial
    });
    world.addBody(boxBody);
    
    // Store pair for synchronization
    if (meshPhysicsPairs) {
        meshPhysicsPairs.push({ mesh: wallMesh, body: boxBody });
    }
    
    return { mesh: wallMesh, body: boxBody };
}

// Show a debug message on screen
function showDebugMessage(message, duration = 2000) {
    const debugElement = document.getElementById('debug-message') || createDebugElement();
    debugElement.textContent = message;
    debugElement.style.display = 'block';
    
    if (duration > 0) {
        setTimeout(() => {
            debugElement.style.display = 'none';
        }, duration);
    }
}

// Create debug element if it doesn't exist
function createDebugElement() {
    const debugElement = document.createElement('div');
    debugElement.id = 'debug-message';
    debugElement.style.position = 'absolute';
    debugElement.style.bottom = '10px';
    debugElement.style.left = '10px';
    debugElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    debugElement.style.color = 'white';
    debugElement.style.padding = '5px';
    debugElement.style.fontFamily = 'monospace';
    debugElement.style.zIndex = 1000;
    document.body.appendChild(debugElement);
    return debugElement;
}

export { 
    setupDebugger, 
    checkIfGrounded, 
    createWallWithMesh, 
    showDebugMessage,
    cannonDebugger
}; 