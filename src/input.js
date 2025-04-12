// Global keyboard state
const keyboard = {};

// Setup keyboard event listeners
function setupKeyboardListeners() {
    document.addEventListener('keydown', (event) => {
        keyboard[event.code] = true;
        // Uncomment for debugging
        // console.log("Key down:", event.code, keyboard);
    });

    document.addEventListener('keyup', (event) => {
        keyboard[event.code] = false;
        // Uncomment for debugging
        // console.log("Key up:", event.code, keyboard);
    });
    
    console.log("Keyboard listeners initialized");
}

// Get movement direction based on keys pressed
function getMovementDirection() {
    const direction = { x: 0, z: 0 };
    
    if (keyboard['KeyW'] || keyboard['ArrowUp']) {
        direction.z = -1;
    }
    if (keyboard['KeyS'] || keyboard['ArrowDown']) {
        direction.z = 1;
    }
    if (keyboard['KeyA'] || keyboard['ArrowLeft']) {
        direction.x = -1;
    }
    if (keyboard['KeyD'] || keyboard['ArrowRight']) {
        direction.x = 1;
    }
    
    // Normalize for diagonal movement
    if (direction.x !== 0 && direction.z !== 0) {
        const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
        direction.x /= length;
        direction.z /= length;
    }
    
    return direction;
}

// Check if a specific key is pressed
function isKeyPressed(keyCode) {
    return keyboard[keyCode] === true;
}

export { keyboard, setupKeyboardListeners, getMovementDirection, isKeyPressed }; 