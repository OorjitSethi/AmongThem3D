import * as THREE from 'https://cdn.skypack.dev/three@0.136.0/build/three.module.js';
import * as CANNON from '../node_modules/cannon-es/dist/cannon-es.js';
import { createWallWithMesh } from './utils.js';

// Create The Skeld Map - main function
function createSkeldMap(scene, world, materials, meshPhysicsPairs, COLLISION_GROUPS) {
    console.log("Creating The Skeld map...");
    
    // Create rooms and corridors
    createCafeteria(scene, world, materials, meshPhysicsPairs, COLLISION_GROUPS);
    createWeapons(scene, world, materials, meshPhysicsPairs, COLLISION_GROUPS);
    createO2AndNavigation(scene, world, materials, meshPhysicsPairs, COLLISION_GROUPS);
    createShields(scene, world, materials, meshPhysicsPairs, COLLISION_GROUPS);
    createAdmin(scene, world, materials, meshPhysicsPairs, COLLISION_GROUPS);
    createCommunications(scene, world, materials, meshPhysicsPairs, COLLISION_GROUPS);
    createStorage(scene, world, materials, meshPhysicsPairs, COLLISION_GROUPS);
    createElectrical(scene, world, materials, meshPhysicsPairs, COLLISION_GROUPS);
    createLowerEngine(scene, world, materials, meshPhysicsPairs, COLLISION_GROUPS);
    createUpperEngine(scene, world, materials, meshPhysicsPairs, COLLISION_GROUPS);
    createReactor(scene, world, materials, meshPhysicsPairs, COLLISION_GROUPS);
    createMedbay(scene, world, materials, meshPhysicsPairs, COLLISION_GROUPS);
    createSecurity(scene, world, materials, meshPhysicsPairs, COLLISION_GROUPS);
    createCorridors(scene, world, materials, meshPhysicsPairs, COLLISION_GROUPS);
    
    // Add task locations
    addTasks(scene, materials);
    
    // Add vents
    addVents(scene, materials);
    
    console.log("The Skeld map created successfully");
}

// Helper function to create a room
function createRoom(scene, world, x, y, z, width, height, length, material, physMaterial, meshPhysicsPairs) {
    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(width, length);
    const roomFloor = new THREE.Mesh(floorGeometry, material.floorMaterial3js);
    roomFloor.rotation.x = -Math.PI / 2;
    roomFloor.position.set(x, y, z);
    roomFloor.receiveShadow = true;
    scene.add(roomFloor);
    
    // Create walls with physics - using the createWallWithMesh function
    
    // Front wall
    createWallWithMesh(
        scene, world, 
        x, y, z + length/2, 
        width, height, 0.1, 
        material.wallMaterial3js, physMaterial.wallMaterial, 
        meshPhysicsPairs
    );
    
    // Back wall
    createWallWithMesh(
        scene, world, 
        x, y, z - length/2, 
        width, height, 0.1, 
        material.wallMaterial3js, physMaterial.wallMaterial, 
        meshPhysicsPairs
    );
    
    // Left wall
    createWallWithMesh(
        scene, world, 
        x - width/2, y, z, 
        0.1, height, length, 
        material.wallMaterial3js, physMaterial.wallMaterial, 
        meshPhysicsPairs
    );
    
    // Right wall
    createWallWithMesh(
        scene, world, 
        x + width/2, y, z, 
        0.1, height, length, 
        material.wallMaterial3js, physMaterial.wallMaterial, 
        meshPhysicsPairs
    );
}

// Helper function to create a corridor
function createCorridor(scene, world, x, y, z, width, height, length, material, physMaterial, meshPhysicsPairs) {
    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(width, length);
    const corridorFloor = new THREE.Mesh(floorGeometry, material.floorMaterial3js);
    corridorFloor.rotation.x = -Math.PI / 2;
    corridorFloor.position.set(x, y, z);
    corridorFloor.receiveShadow = true;
    scene.add(corridorFloor);
    
    // Left wall - using the createWallWithMesh function
    createWallWithMesh(
        scene, world, 
        x - width/2, y, z, 
        0.1, height, length, 
        material.wallMaterial3js, physMaterial.wallMaterial, 
        meshPhysicsPairs
    );
    
    // Right wall - using the createWallWithMesh function
    createWallWithMesh(
        scene, world, 
        x + width/2, y, z, 
        0.1, height, length, 
        material.wallMaterial3js, physMaterial.wallMaterial, 
        meshPhysicsPairs
    );
}

// Helper function to add a task location
function addTask(scene, x, y, z, color, materials) {
    // Using a box instead of a cylinder for tasks
    const taskSize = 1;
    const taskHeight = 0.1;
    const taskGeometry = new THREE.BoxGeometry(taskSize, taskHeight, taskSize);
    const taskMaterial = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.5
    });
    const task = new THREE.Mesh(taskGeometry, taskMaterial);
    task.position.set(x, y, z);
    scene.add(task);
}

// Helper function to add a vent
function addVent(scene, x, y, z, materials) {
    const ventGeometry = new THREE.BoxGeometry(1.5, 0.1, 1.5);
    const vent = new THREE.Mesh(ventGeometry, materials.ventMaterial3js);
    vent.position.set(x, y, z);
    vent.rotation.x = -Math.PI / 2;
    scene.add(vent);
    
    // Add vent grill lines
    for (let i = 0; i < 3; i++) {
        const grillGeometry = new THREE.BoxGeometry(1.4, 0.05, 0.1);
        const grill = new THREE.Mesh(grillGeometry, materials.ventMaterial3js);
        grill.position.set(x, y + 0.05, z - 0.5 + i * 0.5);
        grill.rotation.x = -Math.PI / 2;
        scene.add(grill);
    }
}

// Add all task locations
function addTasks(scene, materials) {
    // Add various task interaction points
    addTask(scene, -10, 0.1, -35, 0xffcc00, materials); // Upload Data in Cafeteria
    addTask(scene, 25, 0.1, -5, 0xffcc00, materials); // Swipe Card in Admin
    addTask(scene, -15, 0.1, 25, 0xffcc00, materials); // Fix Wires in Electrical
    addTask(scene, 12, 0.1, -35, 0xffcc00, materials); // Clean Filter in O2
    addTask(scene, 38, 0.1, -10, 0xffcc00, materials); // Prime Shields
    addTask(scene, -43, 0.1, 0, 0xffcc00, materials); // Start Reactor
    addTask(scene, -33, 0.1, -20, 0xffcc00, materials); // Align Engine Output
    addTask(scene, -33, 0.1, 20, 0xffcc00, materials); // Align Engine Output
    addTask(scene, 38, 0.1, 23, 0xffcc00, materials); // Download Data in Communications
    addTask(scene, 10, 0.1, 35, 0xffcc00, materials); // Fuel Engines in Storage
}

// Add all vents
function addVents(scene, materials) {
    // Add vents in classic locations
    addVent(scene, -15, 0.1, -30, materials); // Security
    addVent(scene, -20, 0.1, -10, materials); // MedBay
    addVent(scene, -33, 0.1, -15, materials); // Upper Engine
    addVent(scene, -33, 0.1, 15, materials); // Lower Engine
    addVent(scene, -10, 0.1, 25, materials); // Electrical
    addVent(scene, 5, 0.1, -5, materials); // Cafeteria
    addVent(scene, 38, 0.1, -5, materials); // Shields
    addVent(scene, 34, 0.1, -35, materials); // Navigation
    addVent(scene, 35, 0.1, 25, materials); // Communications
    addVent(scene, -40, 0.1, 0, materials); // Reactor
}

// Create corridors
function createCorridors(scene, world, materials, meshPhysicsPairs, COLLISION_GROUPS) {
    // Horizontal corridors
    createCorridor(scene, world, -30, 0, 0, 15, 4, 5, materials, materials, meshPhysicsPairs); // Left to center
    createCorridor(scene, world, 13, 0, 0, 12, 4, 5, materials, materials, meshPhysicsPairs); // Center to right
    createCorridor(scene, world, 0, 0, -23, 5, 4, 15, materials, materials, meshPhysicsPairs); // Center to top
    createCorridor(scene, world, 0, 0, 15, 5, 4, 15, materials, materials, meshPhysicsPairs); // Center to bottom
    
    // Vertical corridors
    createCorridor(scene, world, -30, 0, -10, 5, 4, 10, materials, materials, meshPhysicsPairs); // Upper engine to reactor
    createCorridor(scene, world, -30, 0, 10, 5, 4, 10, materials, materials, meshPhysicsPairs); // Lower engine to reactor
    createCorridor(scene, world, -15, 0, -20, 5, 4, 10, materials, materials, meshPhysicsPairs); // Security to center
    createCorridor(scene, world, 25, 0, -15, 5, 4, 15, materials, materials, meshPhysicsPairs); // Weapons to nav
    createCorridor(scene, world, 25, 0, 15, 5, 4, 15, materials, materials, meshPhysicsPairs); // Admin to storage
}

// Create cafeteria room
function createCafeteria(scene, world, materials, meshPhysicsPairs, COLLISION_GROUPS) {
    // Cafeteria is roughly in the center of the map
    const roomWidth = 25;
    const roomLength = 25;
    const roomHeight = 4;
    
    // Main room
    createRoom(scene, world, 0, 0, 0, roomWidth, roomHeight, roomLength, materials, materials, meshPhysicsPairs);
    
    // Center table with emergency button - now rectangular instead of cylindrical
    const tableSize = 10; // Size of the square table
    const tableHeight = 1;
    const tableGeometry = new THREE.BoxGeometry(tableSize, tableHeight, tableSize);
    const table = new THREE.Mesh(tableGeometry, materials.tableMaterial3js);
    table.position.set(0, 0.5, 0);
    scene.add(table);
    
    // Create physics body for center table
    const tableShape = new CANNON.Box(new CANNON.Vec3(tableSize/2, tableHeight/2, tableSize/2));
    const tableBody = new CANNON.Body({ 
        mass: 0,
        material: materials.objectMaterial,
        shape: tableShape,
        position: new CANNON.Vec3(0, 0.5, 0) 
    });
    world.addBody(tableBody);
    meshPhysicsPairs.push({ mesh: table, body: tableBody });
    
    // Emergency button - now rectangular too
    const buttonSize = 2;
    const buttonHeight = 0.5;
    const buttonGeometry = new THREE.BoxGeometry(buttonSize, buttonHeight, buttonSize);
    const button = new THREE.Mesh(buttonGeometry, materials.emergencyButtonMaterial3js);
    button.position.set(0, 1.1, 0);
    scene.add(button);
    
    // Small cafeteria tables
    for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        const radius = 10;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        
        const smallTableGeometry = new THREE.BoxGeometry(3, 0.5, 3);
        const smallTable = new THREE.Mesh(smallTableGeometry, materials.tableMaterial3js);
        smallTable.position.set(x, 0.75, z);
        scene.add(smallTable);
        
        // Create physics body for small table
        const tableShape = new CANNON.Box(new CANNON.Vec3(1.5, 0.25, 1.5));
        const tableBody = new CANNON.Body({
            mass: 0,
            material: materials.objectMaterial,
            shape: tableShape,
            position: new CANNON.Vec3(x, 0.75, z)
        });
        world.addBody(tableBody);
        meshPhysicsPairs.push({ mesh: smallTable, body: tableBody });
    }
}

// Additional room creation functions would go here
// createWeapons, createO2AndNavigation, etc.
// These would follow a similar pattern to createCafeteria

export { 
    createSkeldMap, 
    createRoom, 
    createCorridor, 
    addTask, 
    addVent, 
    addTasks, 
    addVents, 
    createCorridors, 
    createCafeteria
}; 