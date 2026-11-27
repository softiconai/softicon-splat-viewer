import { __, sprintf } from '@wordpress/i18n';

// the viewer's words; the lazy viewer chunk cannot call __(), so view.js hands these over
const messages = {
	// with a number: sprintf here, so a translation may write %1$s
	loading: ( percent ) => sprintf(
		// translators: %s: how much of the 3D scan has loaded, like 40%
		__( 'Loading the 3D scan… %s', 'softicon-splat-viewer' ),
		percent + '%'
	),
	noWebgl: __( 'This browser cannot show 3D scans (WebGL 2 is off or missing).', 'softicon-splat-viewer' ),
	failed: __( 'The 3D scan could not be loaded.', 'softicon-splat-viewer' ),
	label: __( '3D scan. Drag or use the arrow keys to turn it; scroll, pinch or + and − to zoom.', 'softicon-splat-viewer' ),
	walkLabel: __( '3D scan of a place. Drag to look around; walk with W, A, S, D or the arrow keys, or with two fingers.', 'softicon-splat-viewer' ),
	spot: ( number ) => sprintf(
		// translators: %d: the hotspot's number on the 3D scan
		__( 'Hotspot %d', 'softicon-splat-viewer' ),
		number
	),
	close: __( 'Close', 'softicon-splat-viewer' ),
	start: __( 'View in 3D', 'softicon-splat-viewer' ),
	// the visitor's buttons
	reset: __( 'Back to the start view', 'softicon-splat-viewer' ),
	fullscreen: __( 'Full screen', 'softicon-splat-viewer' ),
	hotspots: __( 'Show the hotspots', 'softicon-splat-viewer' ),
	autoRotate: __( 'Turn on its own', 'softicon-splat-viewer' ),
	walk: __( 'Walk inside', 'softicon-splat-viewer' ),
};

export default messages;
