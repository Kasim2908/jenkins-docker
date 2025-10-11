# NASA Trek VR - Moon Viewer

This project replicates the official NASA Trek VR experience for exploring the Moon's surface in virtual reality.

## Features

- **Immersive VR Experience**: View the Moon's surface using your mobile device and VR headset
- **High-Resolution Terrain**: Uses NASA's Moon v14 terrain data from marshub.s3.amazonaws.com
- **LRO WAC Textures**: High-quality lunar surface textures from NASA's Lunar Reconnaissance Orbiter
- **Interactive Path**: Follow a predefined path across the lunar surface
- **Device Orientation Support**: Full support for mobile device orientation tracking

## Quick Start

### Method 1: Double-click to run
1. Double-click `run_server.bat`
2. Wait for the browser to open automatically
3. Click "Launch VR Experience"

### Method 2: Manual start
1. Open command prompt in this directory
2. Run: `python server.py`
3. Open browser to `http://localhost:8000`

## VR Experience Parameters

- **Body**: Moon
- **Starting Coordinates**: 46.538°N, 31.910°E  
- **Terrain Source**: https://marshub.s3.amazonaws.com/moon_v14/
- **Texture Source**: https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02
- **Path**: Predefined lunar surface route
- **Zoom Level**: 8

## Usage Instructions

1. **Desktop**: Click the launch button to start the VR experience
2. **Mobile Device**: 
   - Allow device orientation when prompted (especially on iOS)
   - Rotate device to landscape mode
   - Place device in VR headset for immersive experience
3. **Controls**: Click/tap screen to pause/resume the animation
4. **VR Mode**: The experience automatically detects VR capability and adjusts accordingly

## Technical Details

- Built using Cesium.js for 3D globe rendering
- WebVR support for immersive experiences  
- Real NASA terrain and texture data
- Responsive design for mobile and desktop
- Local server with CORS headers for proper loading

## Requirements

- Python 3.x (for local server)
- Modern web browser with WebGL support
- Mobile device with gyroscope (for VR mode)
- VR headset (optional, for full immersion)

## Troubleshooting

- **iOS Orientation Issues**: Clear browser history and try again
- **VR Not Working**: Ensure device orientation permissions are granted
- **Loading Issues**: Make sure all files are in the correct directory structure
- **Server Won't Start**: Verify Python is installed and accessible from command line

## File Structure

```
massiah2/
├── index.html              # Main launcher page
├── server.py              # Local development server
├── run_server.bat         # Windows batch file to start server
├── README.md              # This file
└── trek.nasa.gov/         # NASA Trek VR files
    └── TrekVR/
        └── VRViewer/
            ├── TrekVR.html    # Main VR application
            ├── js/TrekVR.js   # VR logic and controls
            ├── config.json    # Planetary body configurations
            └── ...            # Additional assets and libraries
```

This project maintains the exact same functionality and parameters as the official NASA Trek VR site while providing a local development environment.