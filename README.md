# Among Us 3D

A 3D first-person interpretation of the popular game "Among Us", built with Three.js and Cannon.js physics. Players can explore a spaceship environment similar to the original game, with interactive elements like doors, vents, and tasks.

## Game Concept

The game recreates the Among Us experience in a first-person 3D environment:
- Crewmates must complete tasks around the spaceship
- Impostors try to sabotage the ship and eliminate crewmates
- Players can call emergency meetings when they find something suspicious
- Voting system to determine who gets ejected from the ship

## Current Features

- First-person camera with mouse look controls
- WASD/Arrow keys movement with physics-based collision detection
- Interactive sliding doors that can be opened/closed with 'E' key
- Visual door highlighting when in interaction range
- Multiple rooms connected by corridors
- Physics-based movement and environment interaction

## Planned Features

- Task completion system
- Vent system for impostor movement
- Sabotage mechanics
- Multiplayer functionality
- Emergency meeting and voting system
- Kill animations and reporting system

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
- **W, A, S, D** keys or **Arrow keys** to move
- **Space** to jump
- **E** to interact with doors and other objects
- **ESC** to release the mouse

## Implementation Details

This game uses:
- Three.js for 3D rendering
- Cannon.js for physics simulations
- Custom collision detection and interaction systems
- Dynamic lighting and materials

## License

MIT 