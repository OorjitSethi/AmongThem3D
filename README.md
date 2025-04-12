# Three.js FPS Game

A simple first-person game built with Three.js where you can walk around and look around a 3D environment.

## Features

- First-person camera with mouse look controls
- WASD movement
- Simple physics (gravity and jumping)
- 3D environment with obstacles

## How to Run

1. Clone this repository
2. Due to browser security restrictions with local files, you need to serve the files using a local development server.

   You can use any of these methods:

   - Using Python:
     ```
     # Python 3
     python -m http.server
     
     # Python 2
     python -m SimpleHTTPServer
     ```

   - Using Node.js and npx:
     ```
     npx serve
     ```

3. Open your browser and navigate to the URL provided by your server (typically http://localhost:8000 or http://localhost:3000)

## Controls

- **Click** on the game window to enable mouse look controls
- **W, A, S, D** keys to move (forward, left, backward, right)
- **Space** to jump
- **ESC** to release the mouse

## Implementation Details

This game uses:
- Three.js for 3D rendering
- PointerLockControls from Three.js for mouse look
- Custom movement and physics implementation

## Extending the Game

To add more features to the game, consider:
- Adding collision detection with the cubes
- Implementing a shooting mechanism
- Adding game objectives or enemies
- Improving the environment design

## License

MIT 