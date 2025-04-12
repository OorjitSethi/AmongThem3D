import * as CANNON from '../node_modules/cannon-es/dist/cannon-es.js';
import CannonDebugger from '../node_modules/cannon-es-debugger/dist/cannon-es-debugger.js';

// Global physics variables
let cannonDebugger;

// Collision filter groups
const COLLISION_GROUPS = {
    DEFAULT: 1,
    PLAYER: 2,
    STATIC: 4,
    OBJECTS: 8,
    TASK: 16,
    VENTS: 32
};

// Initialize physics world
function initPhysics() {
    const world = new CANNON.World({
        gravity: new CANNON.Vec3(0, -9.82, 0) // Earth gravity
    });
    
    return world;
}

// Setup debugger
function setupPhysicsDebugger(scene, world) {
    cannonDebugger = new CannonDebugger(scene, world);
    console.log("Physics debugger initialized");
    return cannonDebugger;
}

// Create a wall body
function createWallBody(world, x, y, z, width, height, depth, material) {
    const halfExtents = new CANNON.Vec3(width/2, height/2, depth/2);
    const boxShape = new CANNON.Box(halfExtents);
    const boxBody = new CANNON.Body({
        mass: 0, // Static body
        position: new CANNON.Vec3(x, y + height/2, z),
        shape: boxShape,
        material: material,
        collisionFilterGroup: COLLISION_GROUPS.STATIC,
        collisionFilterMask: COLLISION_GROUPS.DEFAULT | COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.OBJECTS
    });
    world.addBody(boxBody);
    return boxBody;
}

// Create a floor with physics
function createPhysicsFloor(world, material, collisionGroups) {
    const floorShape = new CANNON.Plane();
    const floorBody = new CANNON.Body({
        mass: 0, // Static body
        shape: floorShape,
        material: material,
        collisionFilterGroup: collisionGroups.STATIC,
        collisionFilterMask: collisionGroups.DEFAULT | collisionGroups.PLAYER | collisionGroups.OBJECTS
    });
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2); // Rotate to be horizontal
    world.addBody(floorBody);
    
    return floorBody;
}

// Create a box body
function createBoxBody(world, x, y, z, width, height, depth, material) {
    const halfExtents = new CANNON.Vec3(width/2, height/2, depth/2);
    const boxShape = new CANNON.Box(halfExtents);
    const boxBody = new CANNON.Body({
        mass: 0, // Static body
        position: new CANNON.Vec3(x, y + height/2, z),
        shape: boxShape,
        material: material,
        collisionFilterGroup: COLLISION_GROUPS.OBJECTS,
        collisionFilterMask: COLLISION_GROUPS.DEFAULT | COLLISION_GROUPS.PLAYER
    });
    world.addBody(boxBody);
    return boxBody;
}

// Create a physical object with both visual mesh and physics body
function createPhysicalObject(scene, world, geometry, material, physMaterial, x, y, z, options = {}) {
    // Create visual mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = options.castShadow !== undefined ? options.castShadow : true;
    mesh.receiveShadow = options.receiveShadow !== undefined ? options.receiveShadow : true;
    scene.add(mesh);
    
    // Create physics body based on geometry type
    let body;
    // Use box bodies for all geometries for consistent physics
    if (geometry.type.includes('Box')) {
        const dimensions = geometry.parameters;
        body = createBoxBody(
            world, 
            x, y, z, 
            dimensions.width, dimensions.height, dimensions.depth, 
            physMaterial
        );
    } else if (geometry.type.includes('Cylinder')) {
        // Convert cylinder to box for physics
        const dimensions = geometry.parameters;
        const boxWidth = dimensions.radiusTop * 2;
        const boxHeight = dimensions.height;
        const boxDepth = dimensions.radiusTop * 2;
        body = createBoxBody(
            world,
            x, y, z,
            boxWidth, boxHeight, boxDepth,
            physMaterial
        );
    } else {
        console.warn('Unsupported geometry type for physics:', geometry.type);
        return { mesh };
    }
    
    // Return both the mesh and body
    return { mesh, body };
}

export {
    initPhysics,
    setupPhysicsDebugger,
    createWallBody,
    createPhysicsFloor,
    createBoxBody,
    createPhysicalObject,
    COLLISION_GROUPS,
    cannonDebugger
}; 