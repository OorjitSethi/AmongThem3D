import * as THREE from 'https://cdn.skypack.dev/three@0.136.0/build/three.module.js';
import * as CANNON from '../node_modules/cannon-es/dist/cannon-es.js';

// Create player physics and visuals
function createPlayer(world, scene, playerMaterial, meshPhysicsPairs, COLLISION_GROUPS) {
    // Create a player shape using boxes instead of cylinder and spheres
    const width = 0.6;         // Width of the player
    const height = 1.8;        // Height of the player
    const depth = 0.6;         // Depth of the player
    
    // Create the player body using a single box
    const playerBody = new CANNON.Body({
        mass: 70, // Mass in kg
        material: playerMaterial,
        linearDamping: 0.5,
        fixedRotation: true,
        collisionFilterGroup: COLLISION_GROUPS.PLAYER,
        collisionFilterMask: COLLISION_GROUPS.DEFAULT | COLLISION_GROUPS.STATIC | COLLISION_GROUPS.OBJECTS
    });
    
    // Add box shape to player body
    const playerShape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
    playerBody.addShape(playerShape);
    
    // Set initial position
    playerBody.position.set(5, 1.6, 7);
    world.addBody(playerBody);
    
    // Create a visual representation of the player's physics body for debugging
    const playerMeshGroup = new THREE.Group();
    
    // Box for body
    const boxGeometry = new THREE.BoxGeometry(width, height, depth);
    const boxMesh = new THREE.Mesh(
        boxGeometry, 
        new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
    );
    playerMeshGroup.add(boxMesh);
    
    // Position the visual mesh
    playerMeshGroup.position.copy(playerBody.position);
    scene.add(playerMeshGroup);
    
    // Add to pairs for syncing
    meshPhysicsPairs.push({ mesh: playerMeshGroup, body: playerBody });
    
    return playerBody;
}

// Update player movement based on keyboard input
function updatePlayerMovement(playerBody, camera, keyboard, isGrounded, moveSpeed, jumpForce, timeStep) {
    // Calculate movement direction vectors
    const frontVector = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const sideVector = new THREE.Vector3(-1, 0, 0).applyQuaternion(camera.quaternion);
    
    // Reset velocity damping for better control
    playerBody.velocity.x *= 0.95;
    playerBody.velocity.z *= 0.95;
    
    // WASD movement with proper physics forces
    if (keyboard['KeyW'] || keyboard['ArrowUp']) {
        playerBody.velocity.x += frontVector.x * moveSpeed * timeStep;
        playerBody.velocity.z += frontVector.z * moveSpeed * timeStep;
    }
    if (keyboard['KeyS'] || keyboard['ArrowDown']) {
        playerBody.velocity.x -= frontVector.x * moveSpeed * timeStep;
        playerBody.velocity.z -= frontVector.z * moveSpeed * timeStep;
    }
    if (keyboard['KeyA'] || keyboard['ArrowLeft']) {
        playerBody.velocity.x += sideVector.x * moveSpeed * timeStep;
        playerBody.velocity.z += sideVector.z * moveSpeed * timeStep;
    }
    if (keyboard['KeyD'] || keyboard['ArrowRight']) {
        playerBody.velocity.x -= sideVector.x * moveSpeed * timeStep;
        playerBody.velocity.z -= sideVector.z * moveSpeed * timeStep;
    }
    
    // Jumping with improved ground detection
    if (keyboard['Space'] && isGrounded) {
        playerBody.velocity.y = jumpForce * timeStep;
    }
}

export { createPlayer, updatePlayerMovement }; 