import * as THREE from 'https://cdn.skypack.dev/three@0.136.0/build/three.module.js';
import * as CANNON from '../node_modules/cannon-es/dist/cannon-es.js';

// Create all materials needed for the game
function createMaterials(world) {
    // Physics materials
    const playerMaterial = new CANNON.Material('player');
    const wallMaterial = new CANNON.Material('wall');
    const floorMaterial = new CANNON.Material('floor');
    const objectMaterial = new CANNON.Material('object');
    
    // Define contact materials (how materials interact)
    const playerWallContactMaterial = new CANNON.ContactMaterial(
        playerMaterial, 
        wallMaterial, 
        {
            friction: 0.2,         // Slightly slippery against walls
            restitution: 0.0       // No bouncing off walls
        }
    );
    
    const playerFloorContactMaterial = new CANNON.ContactMaterial(
        playerMaterial, 
        floorMaterial, 
        {
            friction: 0.5,         // Good grip on floor for controlled movement
            restitution: 0.0       // No bouncing off floor
        }
    );
    
    const playerObjectContactMaterial = new CANNON.ContactMaterial(
        playerMaterial, 
        objectMaterial, 
        {
            friction: 0.3,         // Moderate friction against objects
            restitution: 0.1       // Slight bounce against objects
        }
    );
    
    // Add contact materials to the world
    world.addContactMaterial(playerWallContactMaterial);
    world.addContactMaterial(playerFloorContactMaterial);
    world.addContactMaterial(playerObjectContactMaterial);
    
    // Visual materials for Three.js
    const floorMaterial3js = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.8,
        metalness: 0.2
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
    
    // Return all materials as an object
    return {
        // Physics materials
        playerMaterial,
        wallMaterial,
        floorMaterial,
        objectMaterial,
        
        // Visual materials
        floorMaterial3js,
        wallMaterial3js,
        ceilingMaterial3js,
        tableMaterial3js,
        chairMaterial3js,
        ventMaterial3js,
        taskMaterial3js,
        emergencyButtonMaterial3js
    };
}

// Function to load textures if needed in the future
function loadMaterialTextures() {
    // Implementation for loading textures could be added here
    // const textureLoader = new THREE.TextureLoader();
    // const floorTexture = textureLoader.load('textures/floor.jpg');
    // return { floorTexture };
}

export { createMaterials, loadMaterialTextures }; 