// Add this at the top for debugging
console.log("Script started loading");

// Import Three.js from Skypack CDN - generally more reliable than unpkg for Three.js
import * as THREE from 'https://cdn.skypack.dev/three@0.136.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/PointerLockControls.js';
import * as CANNON from 'https://cdn.skypack.dev/cannon-es@0.20.0';
import CannonDebugger from 'https://cdn.skypack.dev/cannon-es-debugger@1.0.0';

console.log("Imports loaded successfully");

// Initialize keyboard control object
const keyboard = {};

// Create UI elements
const createUI = () => {
    // Create door interaction indicator
    const doorIndicator = document.createElement('div');
    doorIndicator.id = 'door-indicator';
    doorIndicator.style.position = 'absolute';
    doorIndicator.style.bottom = '20px';
    doorIndicator.style.right = '20px';
    doorIndicator.style.background = 'rgba(0, 0, 0, 0.5)';
    doorIndicator.style.color = 'white';
    doorIndicator.style.padding = '10px';
    doorIndicator.style.borderRadius = '5px';
    doorIndicator.style.fontFamily = 'Arial, sans-serif';
    doorIndicator.style.display = 'none';
    doorIndicator.textContent = 'Press E to interact with door';
    document.body.appendChild(doorIndicator);
    
    // Create debug info panel
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.style.position = 'absolute';
    debugPanel.style.top = '10px';
    debugPanel.style.left = '10px';
    debugPanel.style.background = 'rgba(0, 0, 0, 0.7)';
    debugPanel.style.color = 'white';
    debugPanel.style.padding = '10px';
    debugPanel.style.borderRadius = '5px';
    debugPanel.style.fontFamily = 'monospace';
    debugPanel.style.fontSize = '12px';
    debugPanel.style.zIndex = '1000';
    debugPanel.style.width = '300px';
    debugPanel.style.maxHeight = '200px';
    debugPanel.style.overflow = 'auto';
    document.body.appendChild(debugPanel);
    
    // Movement keys help
    const keyHelp = document.createElement('div');
    keyHelp.id = 'key-help';
    keyHelp.style.position = 'absolute';
    keyHelp.style.bottom = '20px';
    keyHelp.style.left = '20px';
    keyHelp.style.background = 'rgba(0, 0, 0, 0.5)';
    keyHelp.style.color = 'white';
    keyHelp.style.padding = '10px';
    keyHelp.style.borderRadius = '5px';
    keyHelp.style.fontFamily = 'Arial, sans-serif';
    keyHelp.innerHTML = 'WASD or Arrows: Move<br>Space: Jump<br>E: Interact with doors<br>Click: Look around';
    document.body.appendChild(keyHelp);
    
    return { doorIndicator, debugPanel, keyHelp };
};

// Store UI elements
let uiElements;

// Set up keyboard controls
document.addEventListener('keydown', (event) => {
    keyboard[event.code] = true;
    console.log("Key pressed:", event.code, keyboard); // Debug keyboard input
    
    // Also add key for moving via WASD and arrows
    if (event.key === 'w' || event.key === 'W') keyboard['KeyW'] = true;
    if (event.key === 's' || event.key === 'S') keyboard['KeyS'] = true;
    if (event.key === 'a' || event.key === 'A') keyboard['KeyA'] = true;
    if (event.key === 'd' || event.key === 'D') keyboard['KeyD'] = true;
    if (event.key === 'ArrowUp') keyboard['ArrowUp'] = true;
    if (event.key === 'ArrowDown') keyboard['ArrowDown'] = true;
    if (event.key === 'ArrowLeft') keyboard['ArrowLeft'] = true;
    if (event.key === 'ArrowRight') keyboard['ArrowRight'] = true;
    if (event.key === ' ' || event.key === 'Space') keyboard['Space'] = true;
});

document.addEventListener('keyup', (event) => {
    keyboard[event.code] = false;
    
    // Also update key for moving via WASD and arrows
    if (event.key === 'w' || event.key === 'W') keyboard['KeyW'] = false;
    if (event.key === 's' || event.key === 'S') keyboard['KeyS'] = false;
    if (event.key === 'a' || event.key === 'A') keyboard['KeyA'] = false;
    if (event.key === 'd' || event.key === 'D') keyboard['KeyD'] = false;
    if (event.key === 'ArrowUp') keyboard['ArrowUp'] = false;
    if (event.key === 'ArrowDown') keyboard['ArrowDown'] = false;
    if (event.key === 'ArrowLeft') keyboard['ArrowLeft'] = false;
    if (event.key === 'ArrowRight') keyboard['ArrowRight'] = false;
    if (event.key === ' ' || event.key === 'Space') keyboard['Space'] = false;
    
    console.log("Key released:", event.code, keyboard);
});

// Fallback movement for browsers that might not trigger keyCode correctly
function checkMovementKeys() {
    // Direct key status check with lower case keys too
    const isWPressed = keyboard['KeyW'] || keyboard['w'] || keyboard['W'];
    const isSPressed = keyboard['KeyS'] || keyboard['s'] || keyboard['S'];
    const isAPressed = keyboard['KeyA'] || keyboard['a'] || keyboard['A'];
    const isDPressed = keyboard['KeyD'] || keyboard['d'] || keyboard['D'];
    const isUpPressed = keyboard['ArrowUp'];
    const isDownPressed = keyboard['ArrowDown'];
    const isLeftPressed = keyboard['ArrowLeft'];
    const isRightPressed = keyboard['ArrowRight'];
    
    return {
        forward: isWPressed || isUpPressed,
        backward: isSPressed || isDownPressed,
        left: isAPressed || isLeftPressed,
        right: isDPressed || isRightPressed,
        jump: keyboard['Space'] || keyboard[' ']
    };
}

// Global variables for Three.js
let camera, scene, renderer, controls;

// Physics world
let world, physicsBodies = [];
const timeStep = 1/60; // Fixed physics timestep in seconds
const maxSubSteps = 5; // Maximum allowed substeps per frame
let lastTime; // Track last frame time for physics calculations

// Arrays to track meshes and their corresponding physics bodies
let meshes = [];
let meshPhysicsPairs = [];

// Define physics materials globally
let playerMaterial, wallMaterial, floorMaterial, objectMaterial;

// Player physics body
let playerBody;

// Global debug renderer
let cannonDebugger;

// Add variables for ground detection
let isGrounded = false;
const raycastDistance = 0.5; // How far down to check for ground

// Collision filter groups
const COLLISION_GROUPS = {
    DEFAULT: 1,
    PLAYER: 2,
    STATIC: 4,
    OBJECTS: 8,
    TASK: 16,
    VENTS: 32,
    DOOR: 64
};

// Global array to store all doors
const doors = [];

// Helper function to create a wall body
function createWallBody(x, y, z, width, height, depth) {
    const halfExtents = new CANNON.Vec3(width/2, height/2, depth/2);
    const boxShape = new CANNON.Box(halfExtents);
    const boxBody = new CANNON.Body({
        mass: 0, // Static body
        position: new CANNON.Vec3(x, y + height/2, z),
        shape: boxShape,
        material: wallMaterial,
        collisionFilterGroup: COLLISION_GROUPS.STATIC,
        collisionFilterMask: COLLISION_GROUPS.DEFAULT | COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.OBJECTS
    });
    world.addBody(boxBody);
    physicsBodies.push(boxBody);
    return boxBody;
}

// Create floor with physics and proper collision filtering
function createPhysicsFloor() {
    // Add floor physics body
    const floorShape = new CANNON.Plane();
    const floorBody = new CANNON.Body({
        mass: 0, // Static body
        shape: floorShape,
        position: new CANNON.Vec3(0, 0, 0), // Explicitly at y=0
        material: floorMaterial,
        collisionFilterGroup: COLLISION_GROUPS.STATIC,
        collisionFilterMask: COLLISION_GROUPS.DEFAULT | COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.OBJECTS
    });
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2); // Rotate to be horizontal
    world.addBody(floorBody);
    
    return floorBody;
}

// Helper function to create a wall with mesh and physics
function createWallWithMesh(x, y, z, width, height, depth, material) {
    // Create wall mesh with solid (non-wireframe) material
    const wallGeometry = new THREE.BoxGeometry(width, height, depth);
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x555555, 
        roughness: 0.8, 
        metalness: 0.2,
        wireframe: false 
    });
    const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
    wallMesh.position.set(x, y + height/2, z);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    scene.add(wallMesh);
    
    // Create wall physics body
    const wallBody = new CANNON.Body({
        mass: 0, // Static body
        shape: new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2)),
        material: wallMaterial,
        collisionFilterGroup: COLLISION_GROUPS.STATIC,
        collisionFilterMask: COLLISION_GROUPS.DEFAULT | COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.OBJECTS
    });
    
    // Position the body
    wallBody.position.set(x, y + height/2, z);
    world.addBody(wallBody);
    
    return { mesh: wallMesh, body: wallBody };
}

// Helper function to create a box body
function createBoxBody(x, y, z, width, height, depth) {
    const halfExtents = new CANNON.Vec3(width/2, height/2, depth/2);
    const boxShape = new CANNON.Box(halfExtents);
    const boxBody = new CANNON.Body({
        mass: 0, // Static body
        position: new CANNON.Vec3(x, y + height/2, z), // Position at center of box
        shape: boxShape,
        material: objectMaterial,
        collisionFilterGroup: COLLISION_GROUPS.OBJECTS,
        collisionFilterMask: COLLISION_GROUPS.DEFAULT | COLLISION_GROUPS.PLAYER
    });
    world.addBody(boxBody);
    physicsBodies.push(boxBody);
    return boxBody;
}

// Initial test to see if Three.js is working
function createTestCube() {
    // Skip test cube and directly init game 
    // This avoids potential conflicts with WebGL contexts
    initGame();
    return;
}

try {
    // Start the game directly
    initGame();
} catch (error) {
    console.error('Game initialization failed:', error);
    document.getElementById('error-container').style.display = 'block';
    document.getElementById('error-container').innerHTML = `
        <h2>Error</h2>
        <p>Failed to initialize the game.</p>
        <p>Error: ${error.message}</p>
        <p>Please check your browser console for more details.</p>
    `;
}

// Main game initialization
function initGame() {
    try {
        console.log("Starting game initialization");
        
        // Create UI elements
        uiElements = createUI();
        
        // Error handler
        window.addEventListener('error', function(event) {
            console.error('Error occurred:', event.error);
            document.body.innerHTML = `<div style="color: red; padding: 20px;">
                <h2>Error loading game:</h2>
                <pre>${event.error.stack || event.error}</pre>
            </div>`;
        });

        // Initialize physics world with correct property name
        world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0), // Earth gravity
            allowSleep: true, // Better performance with sleeping bodies
            broadphase: new CANNON.NaiveBroadphase(), // Simple broadphase for better stability
            solver: new CANNON.GSSolver() // Default solver
        });
        
        // Improve solver settings
        world.solver.iterations = 10; // More iterations for stability
        world.solver.tolerance = 0.01; // Lower tolerance
        
        // Scene setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000510); // Dark space background
        console.log("Scene created");
        
        // Create physics materials first so everything else can use them
        playerMaterial = new CANNON.Material('playerMaterial');
        wallMaterial = new CANNON.Material('wallMaterial');
        floorMaterial = new CANNON.Material('floorMaterial');
        objectMaterial = new CANNON.Material('objectMaterial');
        console.log("Physics materials created");
        
        // Setup contact materials with proper properties
        const playerWallContactMaterial = new CANNON.ContactMaterial(
            playerMaterial, 
            wallMaterial, 
            {
                friction: 0.0,         // No friction against walls
                restitution: 0.1       // Slight bounce against walls
            }
        );
        
        const playerFloorContactMaterial = new CANNON.ContactMaterial(
            playerMaterial, 
            floorMaterial, 
            {
                friction: 0.01,        // Very low friction for smooth movement
                restitution: 0.0       // No bouncing off floor
            }
        );
        
        const playerObjectContactMaterial = new CANNON.ContactMaterial(
            playerMaterial, 
            objectMaterial, 
            {
                friction: 0.01,         // Reduced friction on objects to match floor
                restitution: 0.1       // Slight bounce against objects
            }
        );
        
        // Add contact materials to the world
        world.addContactMaterial(playerWallContactMaterial);
        world.addContactMaterial(playerFloorContactMaterial);
        world.addContactMaterial(playerObjectContactMaterial);
        console.log("Contact materials added to world");
        
        // Initialize Cannon debugger after scene creation
        cannonDebugger = new CannonDebugger(scene, world);
        console.log("Physics debugger initialized");

        // Camera setup
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.y = 1.6; // Approximate eye height
        console.log("Camera created");

        // Renderer setup
        renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance",
            precision: "highp"
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap; // More realistic shadows
        renderer.setClearColor(0x000000, 1); // Clear with black
        renderer.setPixelRatio(window.devicePixelRatio); // For sharper rendering
        document.body.appendChild(renderer.domElement);
        console.log("Renderer created and added to document");

        // Pointer lock controls
        controls = new PointerLockControls(camera, document.body);
        console.log("Controls created");

        // Click event to lock pointer
        document.addEventListener('click', () => {
            controls.lock();
        });
        
        // Create all graphical and physical elements
        createGameEnvironment();
        
        // Player physics body setup must come after world setup
        createPlayerPhysics();

        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        console.log("Starting animation loop");
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

// Create all game environment elements
function createGameEnvironment() {
    // Materials
    const floorMaterial3js = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.8,
        metalness: 0.2,
        side: THREE.DoubleSide // Render both sides to prevent flickering
    });
    
    const wallMaterial3js = new THREE.MeshStandardMaterial({
        color: 0x666666,
        roughness: 0.7,
        metalness: 0.3
    });
    
    const ceilingMaterial3js = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.6,
        metalness: 0.4
    });
    
    const tableMaterial3js = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.5,
        metalness: 0.1
    });
    
    const chairMaterial3js = new THREE.MeshStandardMaterial({
        color: 0x4B4B4B,
        roughness: 0.6,
        metalness: 0.2
    });
    
    const ventMaterial3js = new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 0.4,
        metalness: 0.6
    });
    
    const taskMaterial3js = new THREE.MeshStandardMaterial({
        color: 0x1E90FF,
        roughness: 0.3,
        metalness: 0.7
    });
    
    const emergencyButtonMaterial3js = new THREE.MeshStandardMaterial({
        color: 0xFF0000,
        roughness: 0.2,
        metalness: 0.8,
        emissive: 0xFF0000,
        emissiveIntensity: 0.2
    });

    console.log("Materials created");

    // Create base floor for The Skeld
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial3js);
    floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    floor.position.y = 0.01; // Add a small offset to prevent z-fighting
    floor.receiveShadow = true;
    scene.add(floor);

    // Add floor physics body with explicit position
    const floorShape = new CANNON.Plane();
    const floorBody = new CANNON.Body({
        mass: 0, // Static body
        shape: floorShape,
        position: new CANNON.Vec3(0, 0, 0), // Explicitly at y=0
        material: floorMaterial,
        collisionFilterGroup: COLLISION_GROUPS.STATIC,
        collisionFilterMask: COLLISION_GROUPS.DEFAULT | COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.OBJECTS
    });
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2); // Rotate to be horizontal
    world.addBody(floorBody);

    console.log("Floor added to scene at position:", floorBody.position);

    // Create The Skeld Map
    createSkeldMap();

    // Lighting setup
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

// Helper function to create a room with walls
function createRoom(x, z, width, depth, wallHeight, doorways = [], color = 0x666666) {
    const room = {
        x: x,
        z: z,
        width: width,
        depth: depth,
        walls: [],
        doors: []
    };
    
    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(width, depth);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.7,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(x + width/2, 0, z + depth/2);
    floor.receiveShadow = true;
    scene.add(floor);
    room.floor = floor;
    
    // Create walls (accounting for doorways)
    const createWallSegments = (startX, startZ, endX, endZ, doorwayList) => {
        let relevantDoorways = doorwayList.filter(d => {
            // Determine if this doorway belongs to this wall
            const isHorizontalWall = startZ === endZ;
            const isOnWall = isHorizontalWall 
                ? (d.z === startZ && d.x >= startX && d.x <= endX)
                : (d.x === startX && d.z >= startZ && d.z <= endZ);
            return isOnWall;
        });
        
        // Sort doorways
        if (startZ === endZ) { // Horizontal wall (along X axis)
            relevantDoorways.sort((a, b) => a.x - b.x);
        } else { // Vertical wall (along Z axis)
            relevantDoorways.sort((a, b) => a.z - b.z);
        }
        
        let segments = [];
        let currentStart = { x: startX, z: startZ };
        
        for (const doorway of relevantDoorways) {
            const doorwayStart = startZ === endZ 
                ? { x: doorway.x - doorway.width / 2, z: startZ }
                : { x: startX, z: doorway.z - doorway.width / 2 };
            
            // Create wall segment up to the doorway
            if ((startZ === endZ && doorwayStart.x > currentStart.x) || 
                (startX === endX && doorwayStart.z > currentStart.z)) {
                segments.push({
                    startX: currentStart.x,
                    startZ: currentStart.z,
                    endX: doorwayStart.x,
                    endZ: doorwayStart.z
                });
            }
            
            // Create the door
            const doorX = startZ === endZ ? doorway.x : startX;
            const doorZ = startZ === endZ ? startZ : doorway.z;
            const doorDepth = startZ === endZ ? 0.2 : doorway.width;
            const doorWidth = startZ === endZ ? doorway.width : 0.2;
            
            const door = createDoor(
                doorX, 
                0, 
                doorZ, 
                doorWidth, 
                wallHeight, 
                doorDepth, 
                startZ === endZ
            );
            room.doors.push(door);
            
            // Update current position to after the doorway
            currentStart = startZ === endZ 
                ? { x: doorway.x + doorway.width / 2, z: startZ }
                : { x: startX, z: doorway.z + doorway.width / 2 };
        }
        
        // Create final segment after the last doorway
        if ((startZ === endZ && endX > currentStart.x) || 
            (startX === endX && endZ > currentStart.z)) {
            segments.push({
                startX: currentStart.x,
                startZ: currentStart.z,
                endX: endX,
                endZ: endZ
            });
        }
        
        return segments;
    };
    
    // Create North wall (along X axis, at minimum Z)
    const northWallSegments = createWallSegments(x, z, x + width, z, 
        doorways.filter(d => d.side === 'north'));
    
    // Create East wall (along Z axis, at maximum X)
    const eastWallSegments = createWallSegments(x + width, z, x + width, z + depth, 
        doorways.filter(d => d.side === 'east'));
    
    // Create South wall (along X axis, at maximum Z)
    const southWallSegments = createWallSegments(x, z + depth, x + width, z + depth, 
        doorways.filter(d => d.side === 'south'));
    
    // Create West wall (along Z axis, at minimum X)
    const westWallSegments = createWallSegments(x, z, x, z + depth, 
        doorways.filter(d => d.side === 'west'));
    
    // Combine all segments
    const allSegments = [
        ...northWallSegments,
        ...eastWallSegments,
        ...southWallSegments,
        ...westWallSegments
    ];
    
    // Create actual wall objects for each segment
    for (const segment of allSegments) {
        let wallWidth, wallDepth, wallX, wallZ;
        
        if (segment.startZ === segment.endZ) { // Horizontal wall (along X)
            wallWidth = segment.endX - segment.startX;
            wallDepth = 0.2;
            wallX = segment.startX + wallWidth / 2;
            wallZ = segment.startZ;
        } else { // Vertical wall (along Z)
            wallWidth = 0.2;
            wallDepth = segment.endZ - segment.startZ;
            wallX = segment.startX;
            wallZ = segment.startZ + wallDepth / 2;
        }
        
        if (wallWidth > 0 && wallDepth > 0) {
            const wall = createWallWithMesh(wallX, 0, wallZ, wallWidth, wallHeight, wallDepth, wallMaterial);
            room.walls.push(wall);
        }
    }
    
    return room;
}

// Helper function to create a corridor
function createCorridor(x, z, width, length, wallHeight, orientation) {
    const isHorizontal = orientation === 'horizontal';
    const corridorWidth = isHorizontal ? length : width;
    const corridorDepth = isHorizontal ? width : length;
    
    return createRoom(
        x, 
        z, 
        corridorWidth, 
        corridorDepth, 
        wallHeight, 
        [], // No doorways needed as doors are defined in the rooms
        0x777777 // Grey color for corridors
    );
}

// Function to create the complete Skeld map
function createSkeldMap() {
    const wallHeight = 3;
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x555555, 
        roughness: 0.8, 
        metalness: 0.2 
    });
    
    // Define room colors
    const colors = {
        cafeteria: 0xa0a0a0,
        medbay: 0xb0ddff,
        upperEngine: 0xffccaa,
        lowerEngine: 0xffccaa,
        security: 0xffaaaa,
        electrical: 0xffff99,
        storage: 0xbbbbbb,
        admin: 0xaaffaa,
        communications: 0xffaaff,
        shields: 0xaaaaff,
        navigation: 0xddddaa,
        o2: 0xccffcc,
        weapons: 0xffcccc,
        reactor: 0xff9999,
        corridor: 0x777777
    };
    
    // Create all rooms
    const rooms = {};
    
    // Cafeteria (center of the map)
    rooms.cafeteria = createRoom(0, 0, 25, 20, wallHeight, [
        { side: 'north', x: 12.5, z: 0, width: 3 },  // To weapons
        { side: 'east', x: 25, z: 10, width: 3 },    // To admin
        { side: 'south', x: 12.5, z: 20, width: 3 }, // To storage
        { side: 'west', x: 0, z: 10, width: 3 }      // To medbay
    ], colors.cafeteria);
    
    // Weapons (north of cafeteria)
    rooms.weapons = createRoom(0, -15, 25, 10, wallHeight, [
        { side: 'south', x: 12.5, z: -5, width: 3 }  // To cafeteria
    ], colors.weapons);
    
    // Admin (east of cafeteria)
    rooms.admin = createRoom(30, 0, 15, 15, wallHeight, [
        { side: 'west', x: 30, z: 10, width: 3 },    // To cafeteria
        { side: 'south', x: 37.5, z: 15, width: 3 }  // To storage
    ], colors.admin);
    
    // Storage (south of cafeteria)
    rooms.storage = createRoom(0, 25, 25, 15, wallHeight, [
        { side: 'north', x: 12.5, z: 25, width: 3 },  // To cafeteria
        { side: 'east', x: 25, z: 32.5, width: 3 },   // To admin corridor
        { side: 'south', x: 12.5, z: 40, width: 3 },  // To lower engine
        { side: 'west', x: 0, z: 32.5, width: 3 }     // To electrical
    ], colors.storage);
    
    // Medbay (west of cafeteria)
    rooms.medbay = createRoom(-20, 0, 15, 15, wallHeight, [
        { side: 'east', x: -5, z: 10, width: 3 }     // To cafeteria
    ], colors.medbay);
    
    // Upper Engine (northwest of map)
    rooms.upperEngine = createRoom(-30, -15, 20, 15, wallHeight, [
        { side: 'east', x: -10, z: -7.5, width: 3 },  // To upper reactor corridor
        { side: 'south', x: -20, z: 0, width: 3 }     // To lower reactor corridor
    ], colors.upperEngine);
    
    // Reactor (west of map)
    rooms.reactor = createRoom(-45, 10, 15, 15, wallHeight, [
        { side: 'east', x: -30, z: 17.5, width: 3 }  // To reactor corridor
    ], colors.reactor);
    
    // Lower Engine (southwest of map)
    rooms.lowerEngine = createRoom(-30, 25, 20, 15, wallHeight, [
        { side: 'north', x: -20, z: 25, width: 3 },  // To lower reactor corridor
        { side: 'east', x: -10, z: 32.5, width: 3 }  // To electrical
    ], colors.lowerEngine);
    
    // Electrical (west of storage)
    rooms.electrical = createRoom(-15, 25, 10, 10, wallHeight, [
        { side: 'east', x: -5, z: 30, width: 3 },    // To storage
    ], colors.electrical);
    
    // Communications (south of admin)
    rooms.communications = createRoom(30, 20, 15, 10, wallHeight, [
        { side: 'west', x: 30, z: 25, width: 3 }     // To admin corridor
    ], colors.communications);
    
    // Shields (southeast of map)
    rooms.shields = createRoom(25, 35, 15, 10, wallHeight, [
        { side: 'north', x: 32.5, z: 35, width: 3 }  // To communications corridor
    ], colors.shields);
    
    // Navigation (east of map)
    rooms.navigation = createRoom(50, 10, 15, 15, wallHeight, [
        { side: 'west', x: 50, z: 17.5, width: 3 }   // To navigation corridor
    ], colors.navigation);
    
    // O2 (north of admin)
    rooms.o2 = createRoom(30, -10, 10, 10, wallHeight, [
        { side: 'south', x: 35, z: 0, width: 3 }     // To admin
    ], colors.o2);
    
    // Security (north of reactor)
    rooms.security = createRoom(-30, -5, 15, 10, wallHeight, [
        { side: 'east', x: -15, z: 0, width: 3 },    // To upper medbay corridor
        { side: 'south', x: -22.5, z: 5, width: 3 }  // To reactor corridor
    ], colors.security);
    
    // Add corridors to connect rooms
    // Corridor from Cafeteria to Weapons
    createCorridor(10, -5, 5, 5, wallHeight, 'vertical');
    
    // Corridor from Cafeteria to Admin
    createCorridor(25, 8, 5, 4, wallHeight, 'horizontal');
    
    // Corridor from Cafeteria to Storage
    createCorridor(10, 20, 5, 5, wallHeight, 'vertical');
    
    // Corridor from Cafeteria to Medbay
    createCorridor(-5, 8, 5, 4, wallHeight, 'horizontal');
    
    // Corridor from Medbay to Upper Engine
    createCorridor(-20, -2, 5, 8, wallHeight, 'horizontal');
    
    // Corridor from Upper Engine to Reactor
    createCorridor(-30, 0, 5, 10, wallHeight, 'vertical');
    
    // Corridor from Reactor to Lower Engine
    createCorridor(-30, 15, 5, 10, wallHeight, 'vertical');
    
    // Corridor from Lower Engine to Electrical
    createCorridor(-10, 30, 5, 5, wallHeight, 'horizontal');
    
    // Corridor from Storage to Admin
    createCorridor(25, 17, 5, 15, wallHeight, 'horizontal');
    
    // Corridor from Admin to Navigation
    createCorridor(45, 10, 5, 7, wallHeight, 'horizontal');
    
    // Corridor from Admin to Communications
    createCorridor(37, 15, 5, 10, wallHeight, 'vertical');
    
    // Corridor from Communications to Shields
    createCorridor(32, 30, 5, 5, wallHeight, 'vertical');
    
    return rooms;
}

// Player physics body setup
function createPlayerPhysics() {
    console.log("Creating player physics...");
    
    // Create a player shape using a box
    const width = 0.6;         // Width of the player
    const height = 1.8;        // Height of the player
    const depth = 0.6;         // Depth of the player
    
    // Make sure player material is defined
    if (!playerMaterial) {
        console.error("Player material not defined!");
        playerMaterial = new CANNON.Material('playerMaterial');
    }
    
    // Create player body with a box shape
    playerBody = new CANNON.Body({
        mass: 5, // Reduced mass for better physics
        material: playerMaterial,
        linearDamping: 0.1, // Reduced damping for smoother movement
        angularDamping: 0.99, // Prevent rotation
        fixedRotation: true, // Keep player upright
        allowSleep: false, // Never sleep the player body
        collisionFilterGroup: COLLISION_GROUPS.PLAYER,
        collisionFilterMask: COLLISION_GROUPS.DEFAULT | COLLISION_GROUPS.STATIC | COLLISION_GROUPS.OBJECTS | COLLISION_GROUPS.DOOR
    });
    
    console.log("Player collision groups:", COLLISION_GROUPS.PLAYER);
    console.log("Player collision mask:", COLLISION_GROUPS.DEFAULT | COLLISION_GROUPS.STATIC | COLLISION_GROUPS.OBJECTS);
    
    // Add box shape
    const playerShape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
    playerBody.addShape(playerShape);
    
    // Set initial position - start in cafeteria
    playerBody.position.set(12.5, 3, 10); // Center of cafeteria room, higher off the ground
    world.addBody(playerBody);
    console.log("Player body added to world at position:", playerBody.position);
    
    // Create a visual representation of the player's physics body for debugging
    const playerMeshGroup = new THREE.Group();
    
    // Box for the player body
    const boxGeometry = new THREE.BoxGeometry(width, height, depth);
    const boxMesh = new THREE.Mesh(
        boxGeometry, 
        new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, opacity: 0.8, transparent: true })
    );
    playerMeshGroup.add(boxMesh);
    
    // Add to scene
    scene.add(playerMeshGroup);
    
    // Add to pairs for syncing
    meshPhysicsPairs.push({ mesh: playerMeshGroup, body: playerBody });
    
    console.log("Player physics created successfully");
    return playerBody;
}

// Helper function to create a door
function createDoor(x, y, z, width, height, depth, isHorizontal = true) {
    // Create a door mesh
    const doorGeometry = new THREE.BoxGeometry(width, height, depth);
    const doorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513,
        roughness: 0.7,
        metalness: 0.2 
    });
    const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
    doorMesh.position.set(x, y + height/2, z);
    doorMesh.castShadow = true;
    doorMesh.receiveShadow = true;
    scene.add(doorMesh);

    // Add a door frame to make it more visible
    const frameThickness = 0.1;
    const frameWidth = isHorizontal ? width + frameThickness * 2 : width;
    const frameHeight = height + frameThickness * 2;
    const frameDepth = isHorizontal ? depth : depth + frameThickness * 2;
    
    const frameGeometry = new THREE.BoxGeometry(frameWidth, frameHeight, frameDepth);
    // Use wireframe for the frame to make it visible but not block view
    const frameMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x444444,
        wireframe: true,
        roughness: 0.5,
        metalness: 0.5
    });
    
    const frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
    frameMesh.position.set(x, y + height/2, z);
    scene.add(frameMesh);

    // Create door physics body
    const doorBody = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(x, y + height/2, z),
        shape: new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2)),
        type: CANNON.Body.STATIC,
        collisionFilterGroup: COLLISION_GROUPS.DOOR,
        collisionFilterMask: COLLISION_GROUPS.DEFAULT | COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.OBJECTS
    });
    world.addBody(doorBody);

    // Create door object with properties
    const doorObject = {
        mesh: doorMesh,
        frame: frameMesh,
        body: doorBody,
        isHorizontal: isHorizontal,
        isOpen: false,
        originalPosition: new THREE.Vector3(x, y + height/2, z),
        animating: false
    };

    // Add to physics-mesh pairs for animation
    meshPhysicsPairs.push({ mesh: doorMesh, body: doorBody });
    
    // Add to doors array
    doors.push(doorObject);
    
    return doorObject;
}

// Helper function to create a table with proper compound shape
function createTable(x, y, z, width, height, depth, material) {
    // Create visual mesh
    const tableTop = new THREE.BoxGeometry(width, height, depth);
    const tableMesh = new THREE.Mesh(tableTop, material);
    tableMesh.position.set(x, y + height/2, z);
    tableMesh.castShadow = true;
    tableMesh.receiveShadow = true;
    scene.add(tableMesh);
    
    // Create physics body
    const tableBody = new CANNON.Body({
        mass: 0, // Static body
        material: objectMaterial,
        collisionFilterGroup: COLLISION_GROUPS.OBJECTS,
        collisionFilterMask: COLLISION_GROUPS.DEFAULT | COLLISION_GROUPS.PLAYER
    });
    
    // Add tabletop shape
    const topShape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
    tableBody.addShape(topShape);
    
    // Position the body
    tableBody.position.set(x, y + height/2, z);
    world.addBody(tableBody);
    
    return { mesh: tableMesh, body: tableBody };
}

// Function to interact with doors
function toggleDoor(doorObject) {
    if (!doorObject) return;
    
    const door = doorObject;
    const openDistance = 2; // Distance to move the door when opened
    
    // Don't retrigger animation if already in progress
    if (door.animating) return;
    door.animating = true;
    
    if (!door.isOpen) {
        // Open the door
        const targetPosition = door.originalPosition.clone();
        if (door.isHorizontal) {
            targetPosition.z += openDistance; // Move horizontally
        } else {
            targetPosition.x += openDistance; // Move vertically
        }
        
        // Animate the door opening
        const duration = 500; // milliseconds
        const startTime = Date.now();
        const startPosition = door.mesh.position.clone();
        const frameStartPosition = door.frame.position.clone();
        
        function animateDoorOpen() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Lerp between positions
            door.mesh.position.lerpVectors(startPosition, targetPosition, progress);
            door.frame.position.lerpVectors(frameStartPosition, targetPosition, progress);
            
            // Update physics body position
            const newPosition = new CANNON.Vec3(
                door.mesh.position.x,
                door.mesh.position.y,
                door.mesh.position.z
            );
            door.body.position.copy(newPosition);
            
            if (progress < 1) {
                requestAnimationFrame(animateDoorOpen);
            } else {
                door.isOpen = true;
                door.animating = false;
                console.log("Door opened fully");
            }
        }
        
        animateDoorOpen();
    } else {
        // Close the door
        const targetPosition = door.originalPosition.clone();
        const startPosition = door.mesh.position.clone();
        const frameStartPosition = door.frame.position.clone();
        
        // Animate the door closing
        const duration = 500; // milliseconds
        const startTime = Date.now();
        
        function animateDoorClose() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Lerp between positions
            door.mesh.position.lerpVectors(startPosition, targetPosition, progress);
            door.frame.position.lerpVectors(frameStartPosition, targetPosition, progress);
            
            // Update physics body position
            const newPosition = new CANNON.Vec3(
                door.mesh.position.x,
                door.mesh.position.y,
                door.mesh.position.z
            );
            door.body.position.copy(newPosition);
            
            if (progress < 1) {
                requestAnimationFrame(animateDoorClose);
            } else {
                door.isOpen = false;
                door.animating = false;
                console.log("Door closed fully");
            }
        }
        
        animateDoorClose();
    }
}

// Add event listeners for player interactions with doors
document.addEventListener('keydown', (event) => {
    if (event.key === 'e' || event.key === 'E') {
        // Check if player is near a door
        let nearestDoor = null;
        let minDistance = Infinity;
        
        for (const door of doors) {
            const playerPosition = playerBody.position;
            const doorPosition = door.body.position;
            
            // Calculate distance between player and door
            const distance = Math.sqrt(
                Math.pow(playerPosition.x - doorPosition.x, 2) +
                Math.pow(playerPosition.z - doorPosition.z, 2)
            );
            
            // If player is within interaction range and this is the closest door
            if (distance < 3 && distance < minDistance) {
                minDistance = distance;
                nearestDoor = door;
            }
        }
        
        // If we found a door to interact with
        if (nearestDoor) {
            console.log(`Interacting with door at position (${nearestDoor.body.position.x.toFixed(2)}, ${nearestDoor.body.position.y.toFixed(2)}, ${nearestDoor.body.position.z.toFixed(2)})`);
            console.log(`Door is currently ${nearestDoor.isOpen ? 'open' : 'closed'}`);
            
            // Temporarily highlight the door
            const originalColor = nearestDoor.mesh.material.color.clone();
            nearestDoor.mesh.material.color.set(0xff0000); // Set to red
            
            // Reset color after a short delay
            setTimeout(() => {
                nearestDoor.mesh.material.color.copy(originalColor);
            }, 200);
            
            toggleDoor(nearestDoor);
        } else {
            console.log("No doors within interaction range");
        }
    }
});

// Debug function to check for collisions - simplified to avoid interference
function checkCollisions() {
    // Log the current state for debugging
    if (playerBody) {
        const pos = playerBody.position;
        const vel = playerBody.velocity;
        console.log(`Player state: Pos(${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}) Vel(${vel.x.toFixed(2)}, ${vel.y.toFixed(2)}, ${vel.z.toFixed(2)})`);
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const now = Date.now();
    const deltaTime = Math.min((now - (lastTime || now)) / 1000, 0.1); // Convert to seconds and cap at 100ms
    lastTime = now;
    
    // Step the physics world with proper substeps
    world.step(timeStep, deltaTime, 3); // Reduce substeps for better performance
    
    // Enable debug renderer for troubleshooting
    if (cannonDebugger) {
        cannonDebugger.update();
    }
    
    // Synchronize meshes with physics bodies EXCEPT player
    for(let i = 0; i < meshPhysicsPairs.length; i++) {
        const pair = meshPhysicsPairs[i];
        // Skip the player so we don't override direct position updates
        if (pair.body === playerBody) continue;
        
        pair.mesh.position.copy(pair.body.position);
        pair.mesh.quaternion.copy(pair.body.quaternion);
    }
    
    // Check if player is grounded using raycasting
    isGrounded = checkIfGrounded();
    
    // Check if player is near any doors and update UI
    checkDoorProximity();
    
    // Occasionally log debug info
    if (Math.random() < 0.05) { // ~5% chance each frame
        checkCollisions();
    }
    
    // Get current movement key status
    const keys = checkMovementKeys();
    
    // DIRECT POSITION UPDATE with increased speed
    const moveSpeed = 0.3; // Units per frame - increased for better responsiveness
    
    // Get camera direction vectors for movement relative to where player is looking
    const frontVector = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    frontVector.y = 0; // Keep movement on the horizontal plane
    frontVector.normalize();
    
    const sideVector = new THREE.Vector3(-1, 0, 0).applyQuaternion(camera.quaternion);
    sideVector.y = 0; // Keep movement on the horizontal plane
    sideVector.normalize();
    
    // Calculate movement direction
    const moveDirection = new THREE.Vector3(0, 0, 0);
    
    if (keys.forward) moveDirection.add(frontVector);
    if (keys.backward) moveDirection.sub(frontVector);
    if (keys.left) moveDirection.add(sideVector);
    if (keys.right) moveDirection.sub(sideVector);
    
    // Normalize the movement vector to maintain consistent speed regardless of direction
    if (moveDirection.length() > 0) {
        moveDirection.normalize();
        
        // Apply the movement to player position directly
        const movement = moveDirection.multiplyScalar(moveSpeed);
        playerBody.position.x += movement.x;
        playerBody.position.z += movement.z;
        
        // Update the green wireframe to match player position too
        for(let i = 0; i < meshPhysicsPairs.length; i++) {
            const pair = meshPhysicsPairs[i];
            if (pair.body === playerBody) {
                pair.mesh.position.copy(playerBody.position);
            }
        }
    }
    
    // Handle jumping with direct position updates
    if (keys.jump && isGrounded) {
        playerBody.position.y += 0.1; // Small initial lift
        playerBody.velocity.y = 5; // Then add upward velocity
    } else if (!isGrounded) {
        // Apply gravity manually when in air
        playerBody.velocity.y -= 9.8 * deltaTime; // Simple gravity
        playerBody.position.y += playerBody.velocity.y * deltaTime;
    } else {
        // On ground, stop vertical movement
        playerBody.velocity.y = 0;
    }
    
    // Update camera position to match player position
    camera.position.copy(playerBody.position);
    
    // Update debug panel
    updateDebugPanel();
    
    renderer.render(scene, camera);
}

// Update debug panel with current status
function updateDebugPanel() {
    if (!uiElements || !uiElements.debugPanel || !playerBody) return;
    
    const debugPanel = uiElements.debugPanel;
    const fps = lastTime ? Math.round(1000 / (Date.now() - lastTime)) : 0;
    
    debugPanel.innerHTML = `
        <div><strong>Position:</strong> X: ${playerBody.position.x.toFixed(2)}, Y: ${playerBody.position.y.toFixed(2)}, Z: ${playerBody.position.z.toFixed(2)}</div>
        <div><strong>Velocity:</strong> X: ${playerBody.velocity.x.toFixed(2)}, Y: ${playerBody.velocity.y.toFixed(2)}, Z: ${playerBody.velocity.z.toFixed(2)}</div>
        <div><strong>Grounded:</strong> ${isGrounded ? 'Yes' : 'No'}</div>
        <div><strong>Keys:</strong> ${Object.keys(keyboard).filter(k => keyboard[k]).join(', ')}</div>
        <div><strong>FPS:</strong> ${fps}</div>
        <div><strong>Active Keys:</strong> ${JSON.stringify(keyboard)}</div>
    `;
}

// Check if player is on the ground using raycasting
function checkIfGrounded() {
    // If player or world not initialized yet, just return false
    if (!playerBody || !world) return false;
    
    // Raycast distance for ground detection
    const raycastDistance = 1.1; // Slightly more than half player height
    
    // Start slightly inside player's bounding volume
    const start = new CANNON.Vec3(
        playerBody.position.x,
        playerBody.position.y - 0.8, // Start lower to make sure we're below the player center
        playerBody.position.z
    );
    
    // End below the player
    const end = new CANNON.Vec3(
        playerBody.position.x,
        playerBody.position.y - raycastDistance,
        playerBody.position.z
    );
    
    // Do the raycast
    const result = new CANNON.RaycastResult();
    world.raycastClosest(start, end, {
        collisionFilterMask: COLLISION_GROUPS.STATIC | COLLISION_GROUPS.OBJECTS, // Detect both static and object bodies
        skipBackfaces: true
    }, result);
    
    // If we hit something, we're grounded
    return result.hasHit;
}

// Function to check if player is near any doors
function checkDoorProximity() {
    if (!playerBody || !uiElements || !uiElements.doorIndicator) return;
    
    let nearestDoor = null;
    let minDistance = Infinity;
    
    for (const door of doors) {
        const playerPosition = playerBody.position;
        const doorPosition = door.body.position;
        
        // Calculate distance between player and door
        const distance = Math.sqrt(
            Math.pow(playerPosition.x - doorPosition.x, 2) +
            Math.pow(playerPosition.z - doorPosition.z, 2)
        );
        
        // If player is within interaction range and this is the closest door
        if (distance < 3 && distance < minDistance) {
            minDistance = distance;
            nearestDoor = door;
        }
    }
    
    // Show/hide the door indicator based on proximity
    if (nearestDoor) {
        uiElements.doorIndicator.style.display = 'block';
    } else {
        uiElements.doorIndicator.style.display = 'none';
    }
}