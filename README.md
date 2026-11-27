# SoftIcon Splat Viewer

A WordPress block that shows 3D scans (Gaussian splats). Set the view, the camera and hotspots right in the block editor. No external services.

## Development

```bash
npm install
npm run start   # watch
npm run build   # production build
npm run lint
npm run zip     # build + translations + release zip
```

Shared editor helpers come from the `softicon-tools` folder next to this plugin. `npm run tools` copies them into `src/vendor/softicon-tools/` before each build.

## License

GPLv2 or later.
