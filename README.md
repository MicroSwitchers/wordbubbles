# Word Bubbling - PWA Setup Guide

## Quick Start

1. **Generate Icons**: Open `generate-icons.html` in a browser and click the buttons to download `icon-192.png` and `icon-512.png`
2. **Deploy**: Upload all files to your web server
3. **Access**: Visit the app on your phone and use "Add to Home Screen"

## Files Structure

- `index.html` - Main application
- `manifest.json` - PWA manifest
- `service-worker.js` - Service worker for offline support and updates
- `generate-icons.html` - Icon generator tool
- `icon-192.png` - App icon (192x192) - *needs to be generated*
- `icon-512.png` - App icon (512x512) - *needs to be generated*

## How to Deploy Updates

When you make changes to the app and want users to receive the update:

1. **Update the version** in `service-worker.js`:
   ```javascript
   const CACHE_NAME = 'word-bubbling-v1.0.1'; // Increment version
   ```

2. **Upload the changed files** to your server

3. **Users will see an update banner** the next time they visit the app

4. **They click "Update Now"** and the app reloads with the new version

## Important Notes

### Service Worker Path
The service worker is registered at `/service-worker.js`. Make sure:
- If your app is NOT in the root directory, update the path in `index.html`:
  ```javascript
  navigator.serviceWorker.register('/your-subdirectory/service-worker.js')
  ```
- Update `start_url` in `manifest.json` accordingly

### Testing Locally
- Use a local server (not `file://`): `python -m http.server 8000`
- Service workers require HTTPS in production (localhost is exempt)

### Mobile Responsive Features
- Touch-optimized controls (minimum 44px touch targets)
- Responsive text sizing for small screens
- Collapsible controls panel on mobile
- Support for both portrait and landscape orientations

## Updating the App

### To release a new version:

1. Make your code changes in `index.html`
2. Increment the version in `service-worker.js`:
   ```javascript
   const CACHE_NAME = 'word-bubbling-v1.0.2'; // New version
   ```
3. Deploy to your server
4. Users will automatically be notified of the update

## Browser Support

- ✅ Chrome/Edge (Mobile & Desktop)
- ✅ Safari (Mobile & Desktop)
- ✅ Firefox (Mobile & Desktop)
- ✅ Samsung Internet

## Troubleshooting

**Update not showing?**
- Clear browser cache
- Unregister service worker in DevTools > Application > Service Workers
- Check console for errors

**Icons not appearing?**
- Ensure icon files are generated and uploaded
- Verify paths in `manifest.json` match your server structure
- Icons must be square PNG files

**App won't install?**
- Requires HTTPS (except localhost)
- Manifest must be valid JSON
- Icons must be accessible
