// The 3D viewer: Spark draws the Gaussian splats inside a three.js scene. Loaded as its own chunk by view.js,
// only when the block is near the screen. Plain JS, no React; the editor drives it with the same config and asks
// it questions (alsv:ask) that only it can answer: the current view and the scan's middle. Hotspots: Spots.js.
import { Box3, MathUtils, Matrix4, PerspectiveCamera, Scene, Spherical, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SparkRenderer, SplatMesh } from '@sparkjsdev/spark';
import Spots from './Spots';
import Tools from './Tools';

const hasWebgl2 = () => {
	try {
		return !! document.createElement( 'canvas' ).getContext( 'webgl2' );
	} catch ( e ) {
		return false;
	}
};

const div = ( className, parent ) => {
	const el = parent.ownerDocument.createElement( 'div' );
	el.className = className;
	parent.appendChild( el );
	return el;
};

const round = ( vector ) => vector.toArray().map( ( value ) => Math.round( value * 1000 ) / 1000 );

// the part of the scan most splats are in, in the scan's own coordinates: a few far-off stray splats
// ("floaters") must not decide the framing
const coreBox = ( mesh ) => {
	const total = mesh.packedSplats?.numSplats || 0;
	if ( ! total ) {
		return mesh.getBoundingBox( true );
	}
	const step = Math.max( 1, Math.floor( total / 60000 ) );
	const axes = [ [], [], [] ];
	let index = 0;
	mesh.packedSplats.forEachSplat( ( i, center ) => {
		if ( 0 === index++ % step ) {
			axes[ 0 ].push( center.x );
			axes[ 1 ].push( center.y );
			axes[ 2 ].push( center.z );
		}
	} );
	const range = axes.map( ( list ) => {
		list.sort( ( a, b ) => a - b );
		return [ list[ Math.floor( list.length * 0.02 ) ], list[ Math.floor( list.length * 0.98 ) ] ];
	} );
	return new Box3( new Vector3( range[ 0 ][ 0 ], range[ 1 ][ 0 ], range[ 2 ][ 0 ] ), new Vector3( range[ 0 ][ 1 ], range[ 1 ][ 1 ], range[ 2 ][ 1 ] ) );
};

// keys for walking: forward/back and sideways steps, and turning
const MOVES = { KeyW: [ 1, 0 ], ArrowUp: [ 1, 0 ], KeyS: [ -1, 0 ], ArrowDown: [ -1, 0 ], KeyA: [ 0, -1 ], KeyD: [ 0, 1 ] };
const TURNS = { ArrowLeft: 1, ArrowRight: -1 };
// keys for going around the scan: turn (around, up and down) and zoom
const ORBIT = { ArrowLeft: [ 1, 0 ], ArrowRight: [ -1, 0 ], ArrowUp: [ 0, -1 ], ArrowDown: [ 0, 1 ] };
const ZOOM = { Equal: -1, NumpadAdd: -1, Minus: 1, NumpadSubtract: 1 };

export default class Viewer {
	constructor( el, config, messages ) {
		this.el = el;
		this.messages = messages;
		this.window = el.ownerDocument.defaultView;
		this.stage = el.querySelector( '.alsv_stage' ) || div( 'alsv_stage', el );
		if ( ! hasWebgl2() ) {
			this.note( messages.noWebgl );
			return;
		}

		this.canvas = el.ownerDocument.createElement( 'canvas' );
		this.canvas.className = 'alsv_canvas';
		this.canvas.tabIndex = 0;
		this.canvas.setAttribute( 'role', 'img' );
		this.stage.appendChild( this.canvas );

		this.renderer = new WebGLRenderer( { canvas: this.canvas, antialias: false, alpha: true } );
		this.scene = new Scene();
		this.camera = new PerspectiveCamera( 50, 1, 0.01, 1000 );
		this.camera.rotation.order = 'YXZ';
		this.spark = new SparkRenderer( { renderer: this.renderer } );
		this.scene.add( this.spark );

		this.controls = new OrbitControls( this.camera, this.canvas );
		this.controls.enableDamping = true;
		// a visitor who turns the scan stops it turning on its own
		this.controls.addEventListener( 'start', () => {
			this.touched = true;
			this.stopSpin();
		} );

		// walking: where the camera looks, keys held down, pointers on the canvas
		this.look = { yaw: 0, pitch: 0 };
		this.keys = new Set();
		this.pointers = new Map();
		this.radius = 1;
		this.walkEvents();

		this.progress = div( 'alsv_progress', this.stage );
		this.progress.hidden = true;
		this.spots = new Spots( this );
		this.tools = new Tools( this );
		this.placeEvents();

		this.resize = this.resize.bind( this );
		this.resizer = new this.window.ResizeObserver( this.resize );
		this.resizer.observe( this.stage );
		this.resize();

		// draw only while the viewer is on screen
		this.time = 0;
		this.watcher = new this.window.IntersectionObserver( ( entries ) => {
			this.visible = entries.some( ( entry ) => entry.isIntersecting );
			this.renderer.setAnimationLoop( this.visible ? ( time ) => this.frame( time ) : null );
		} );
		this.watcher.observe( this.stage );

		this.onAsk = this.onAsk.bind( this );
		this.listen( el, 'alsv:ask', this.onAsk );
		// from the block editor: the hotspot open in the sidebar
		this.listen( el, 'alsv:select', ( event ) => this.spots.select( event.detail?.id ) );

		this.update( config );
	}

	listen( target, type, handler, options ) {
		target.addEventListener( type, handler, options );
		( this.unlisten ||= [] ).push( () => target.removeEventListener( type, handler, options ) );
	}

	note( text ) {
		const box = this.stage.querySelector( '.alsv_note' ) || div( 'alsv_note', this.stage );
		box.textContent = text;
	}

	resize() {
		const width = this.stage.clientWidth || 1;
		const height = this.stage.clientHeight || 1;
		this.renderer.setSize( width, height, false );
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
	}

	// the visitor's own choice (the toolbar), or the block's
	walking() {
		return 'walk' === ( this.mode || this.scan?.camera.mode );
	}

	// how sharp it draws: Low is quick everywhere, Auto is lighter on phones, High is the screen's own sharpness
	sharpness( quality ) {
		if ( 'low' === quality ) {
			return 0.75;
		}
		const screen = Math.min( this.window.devicePixelRatio || 1, 2 );
		const phone = this.window.matchMedia( '(pointer: coarse)' ).matches && Math.min( this.window.screen.width, this.window.screen.height ) < 820;
		return 'auto' === quality && phone ? Math.min( screen, 1.25 ) : screen;
	}

	stopSpin() {
		if ( this.controls.autoRotate ) {
			this.spin = false;
			this.controls.autoRotate = false;
			this.tools.sync();
		}
	}

	// back to the block's start view (the toolbar)
	reset() {
		this.touched = false;
		this.spin = null;
		this.setCamera();
	}

	frame( time ) {
		const seconds = this.time ? Math.min( ( time - this.time ) / 1000, 0.1 ) : 0;
		this.time = time;
		if ( this.walking() ) {
			this.walkStep( seconds );
		} else {
			// turning on its own (once the scan is framed) moves the view as a visitor would: a later change (the
			// editor's, the toolbar's) keeps it where it is
			if ( this.ready && this.controls.autoRotate ) {
				this.touched = true;
			}
			// by time, not by frame: the same speed on a 60 Hz and a 120 Hz screen
			this.controls.update( seconds || null );
		}
		if ( this.mesh ) {
			this.spots.frame();
		}
		this.renderer.render( this.scene, this.camera );
	}

	update( config ) {
		if ( ! this.renderer ) {
			return;
		}
		const old = this.scan;
		const scan = config.scan;
		this.scan = scan;
		// a new turn, a new start view or a new mode frames the scan again, unless someone is looking around
		const key = ( value ) => JSON.stringify( value );
		if ( old && ( key( old.transform ) !== key( scan.transform ) || key( [ old.camera.mode, old.camera.position, old.camera.target ] ) !== key( [ scan.camera.mode, scan.camera.position, scan.camera.target ] ) ) ) {
			this.touched = false;
			this.mode = null;
		}
		// the block's turning setting changed (the editor): it counts again
		if ( old && old.camera.autoRotate !== scan.camera.autoRotate ) {
			this.spin = null;
		}
		const sharpness = this.sharpness( scan.look.quality );
		if ( sharpness !== this.renderer.getPixelRatio() ) {
			this.renderer.setPixelRatio( sharpness );
			this.resize();
		}
		this.spots.set( scan.hotspots, !! config.editor );
		this.tools.set( scan.toolbar, scan.hotspots.length > 0 );
		if ( scan.file.url !== this.url ) {
			this.load( scan.file.url, scan.file.format );
		}
		this.place();
		this.setCamera();
	}

	load( url, format ) {
		this.url = url;
		this.ready = false;
		this.touched = false;
		this.localBox = null;
		this.el.classList.remove( 'alsv_ready' );
		if ( this.mesh ) {
			this.scene.remove( this.mesh );
			this.mesh.dispose();
		}
		this.showProgress( 0 );
		const name = url.split( /[?#]/ )[ 0 ].split( '/' ).pop() || 'scan.' + format;
		const mesh = new SplatMesh( {
			url,
			fileName: /\.[a-z]+$/i.test( name ) ? name : name + '.' + format,
			onProgress: ( event ) => event.total && this.showProgress( event.loaded / event.total ),
		} );
		this.mesh = mesh;
		this.scene.add( mesh );
		mesh.initialized.then( () => {
			if ( this.mesh !== mesh ) {
				return;
			}
			this.localBox = coreBox( mesh );
			this.ready = true;
			this.progress.hidden = true;
			this.el.classList.add( 'alsv_ready' );
			this.place();
			this.setCamera();
		} ).catch( () => {
			if ( this.mesh === mesh ) {
				this.progress.hidden = true;
				this.note( this.messages.failed );
			}
		} );
	}

	showProgress( share ) {
		this.progress.hidden = false;
		this.progress.textContent = this.messages.loading( Math.round( share * 100 ) );
		this.progress.style.setProperty( '--alsv-progress', share );
	}

	// the block's turn, size and shift of the scan
	place() {
		if ( ! this.mesh ) {
			return;
		}
		const { rotX, rotY, rotZ, scale, offset } = this.scan.transform;
		this.mesh.rotation.set( MathUtils.degToRad( rotX ), MathUtils.degToRad( rotY ), MathUtils.degToRad( rotZ ) );
		this.mesh.scale.setScalar( scale );
		this.mesh.position.set( ...offset );
		this.mesh.updateMatrixWorld( true );
	}

	// the scan's main part where it stands now
	box() {
		return this.localBox.clone().applyMatrix4( this.mesh.matrixWorld );
	}

	// the saved view, or one that frames the scan
	setCamera() {
		const camera = this.scan.camera;
		const walking = this.walking();
		this.camera.fov = camera.fov;
		this.camera.updateProjectionMatrix();
		this.controls.enabled = ! walking;
		// the poster's description first: what the scan shows
		const label = walking ? this.messages.walkLabel : this.messages.label;
		this.canvas.setAttribute( 'aria-label', this.scan.poster.alt ? this.scan.poster.alt + '. ' + label : label );
		this.controls.enableZoom = camera.zoom;
		// the visitor's choice (toolbar, touch), or the block's; never for visitors who ask for less motion
		const spin = this.spin ?? ( camera.autoRotate && ! this.window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches );
		this.controls.autoRotate = ! walking && spin;
		this.tools.sync();
		this.controls.autoRotateSpeed = camera.speed * 2;
		if ( ! this.ready || this.touched ) {
			return;
		}
		const box = this.box();
		const center = box.getCenter( new Vector3() );
		this.radius = Math.max( box.getSize( new Vector3() ).length() / 2, 0.01 );
		this.controls.minDistance = this.radius * 0.05;
		this.controls.maxDistance = this.radius * 8;
		this.camera.near = this.radius / 1000;
		this.camera.far = this.radius * 100;
		this.camera.updateProjectionMatrix();

		// a saved view is for the block's own mode
		const saved = camera.position && camera.target && ( ! this.mode || this.mode === camera.mode );
		if ( walking ) {
			const from = saved ? new Vector3( ...camera.position ) : center;
			const to = saved ? new Vector3( ...camera.target ) : center.clone().add( new Vector3( 0, 0, -1 ) );
			this.camera.position.copy( from );
			this.lookAt( to );
			return;
		}
		if ( saved ) {
			this.camera.position.set( ...camera.position );
			this.controls.target.set( ...camera.target );
		} else {
			const distance = this.radius / Math.sin( MathUtils.degToRad( camera.fov ) / 2 );
			this.controls.target.copy( center );
			this.camera.position.copy( center ).add( new Vector3( 0, this.radius * 0.3, distance ) );
		}
		this.controls.update();
	}

	// walk mode: turn the camera toward a point
	lookAt( point ) {
		const direction = point.clone().sub( this.camera.position ).normalize();
		this.look.yaw = Math.atan2( -direction.x, -direction.z );
		this.look.pitch = Math.asin( MathUtils.clamp( direction.y, -1, 1 ) );
		this.camera.rotation.set( this.look.pitch, this.look.yaw, 0 );
	}

	walkEvents() {
		const canvas = this.canvas;
		const listen = ( type, handler, options ) => this.listen( canvas, type, handler, options );
		listen( 'pointerdown', ( event ) => {
			if ( this.walking() ) {
				canvas.setPointerCapture( event.pointerId );
				this.pointers.set( event.pointerId, [ event.clientX, event.clientY ] );
				this.touched = true;
			}
		} );
		listen( 'pointermove', ( event ) => {
			const last = this.pointers.get( event.pointerId );
			if ( ! this.walking() || ! last ) {
				return;
			}
			const before = this.spread();
			this.pointers.set( event.pointerId, [ event.clientX, event.clientY ] );
			if ( this.pointers.size > 1 ) {
				// two fingers apart: forward, together: back
				if ( this.scan.camera.zoom ) {
					this.step( ( this.spread() - before ) * this.radius * 0.004, 0 );
				}
				return;
			}
			this.look.yaw -= ( event.clientX - last[ 0 ] ) * 0.004;
			this.look.pitch = MathUtils.clamp( this.look.pitch - ( ( event.clientY - last[ 1 ] ) * 0.004 ), -1.4, 1.4 );
			this.camera.rotation.set( this.look.pitch, this.look.yaw, 0 );
		} );
		const up = ( event ) => this.pointers.delete( event.pointerId );
		listen( 'pointerup', up );
		listen( 'pointercancel', up );
		listen( 'wheel', ( event ) => {
			if ( this.walking() && this.scan.camera.zoom ) {
				event.preventDefault();
				this.touched = true;
				this.step( -Math.sign( event.deltaY ) * this.radius * 0.05, 0 );
			}
		}, { passive: false } );
		listen( 'keydown', ( event ) => {
			if ( ! this.walking() ) {
				this.orbitKey( event );
				return;
			}
			if ( MOVES[ event.code ] || TURNS[ event.code ] ) {
				event.preventDefault();
				this.touched = true;
				this.keys.add( event.code );
			}
		} );
		listen( 'keyup', ( event ) => this.keys.delete( event.code ) );
		listen( 'blur', () => this.keys.clear() );
	}

	// the block editor's "Add a hotspot": a click on the scan (not a drag) places it, Enter places it in the
	// middle of the view, Esc stops; the hint comes in the editor's words
	placeEvents() {
		const canvas = this.canvas;
		let start = null;
		const place = ( x, y ) => {
			const position = this.ready ? this.spots.pick( x, y ) : null;
			if ( position ) {
				this.spots.tell( 'add', { position } );
			} else {
				this.hint.textContent = this.placing.miss || '';
			}
		};
		this.listen( this.el, 'alsv:place', ( event ) => {
			const on = !! event.detail?.on;
			this.placing = on ? event.detail : null;
			this.el.classList.toggle( 'alsv_placing', on );
			if ( on ) {
				this.hint ||= div( 'alsv_hint', this.stage );
				this.hint.textContent = event.detail.hint || '';
			}
			if ( this.hint ) {
				this.hint.hidden = ! on;
			}
		} );
		this.listen( canvas, 'pointerdown', ( event ) => {
			start = this.placing && 0 === event.button ? [ event.clientX, event.clientY ] : null;
		} );
		this.listen( canvas, 'pointerup', ( event ) => {
			if ( start && this.placing && Math.hypot( event.clientX - start[ 0 ], event.clientY - start[ 1 ] ) < 5 ) {
				place( event.clientX, event.clientY );
			}
			start = null;
		} );
		this.listen( canvas, 'keydown', ( event ) => {
			if ( ! this.placing ) {
				return;
			}
			if ( 'Enter' === event.key ) {
				event.preventDefault();
				const rect = canvas.getBoundingClientRect();
				place( rect.left + ( rect.width / 2 ), rect.top + ( rect.height / 2 ) );
			} else if ( 'Escape' === event.key ) {
				this.spots.tell( 'cancel', {} );
			}
		} );
		// a click on the scan closes an open card
		this.listen( canvas, 'pointerdown', () => this.spots.close( false ) );
	}

	// going around with the keyboard: the arrows turn, + and − zoom
	orbitKey( event ) {
		const turn = ORBIT[ event.code ];
		const zoom = this.scan.camera.zoom && ZOOM[ event.code ];
		if ( ! this.ready || ( ! turn && ! zoom ) || event.altKey || event.ctrlKey || event.metaKey ) {
			return;
		}
		event.preventDefault();
		this.touched = true;
		this.stopSpin();
		const target = this.controls.target;
		const around = new Spherical().setFromVector3( this.camera.position.clone().sub( target ) );
		if ( turn ) {
			around.theta += turn[ 0 ] * 0.15;
			around.phi = MathUtils.clamp( around.phi + ( turn[ 1 ] * 0.12 ), 0.05, Math.PI - 0.05 );
		}
		if ( zoom ) {
			around.radius = MathUtils.clamp( around.radius * ( zoom < 0 ? 0.85 : 1 / 0.85 ), this.controls.minDistance, this.controls.maxDistance );
		}
		this.camera.position.copy( target ).add( new Vector3().setFromSpherical( around ) );
		this.camera.lookAt( target );
	}

	spread() {
		const [ a, b ] = [ ...this.pointers.values() ];
		return b ? Math.hypot( a[ 0 ] - b[ 0 ], a[ 1 ] - b[ 1 ] ) : 0;
	}

	// forward along the floor (not up or down) and sideways
	step( forward, side ) {
		const yaw = this.look.yaw;
		this.camera.position.x += ( -Math.sin( yaw ) * forward ) + ( Math.cos( yaw ) * side );
		this.camera.position.z += ( -Math.cos( yaw ) * forward ) - ( Math.sin( yaw ) * side );
	}

	walkStep( seconds ) {
		let forward = 0;
		let side = 0;
		let turn = 0;
		this.keys.forEach( ( code ) => {
			forward += MOVES[ code ]?.[ 0 ] || 0;
			side += MOVES[ code ]?.[ 1 ] || 0;
			turn += TURNS[ code ] || 0;
		} );
		if ( turn ) {
			this.look.yaw += turn * seconds * 1.5;
			this.camera.rotation.set( this.look.pitch, this.look.yaw, 0 );
		}
		if ( forward || side ) {
			const speed = this.radius * 0.6 * seconds;
			this.step( forward * speed, side * speed );
		}
	}

	// the view as an image for the poster: the stage's background (style.scss .alsv_stage) under the scan, as the
	// canvas itself is see-through. Drawn and read in one go, as WebGL clears the canvas after each frame.
	snapshot() {
		// at least 1600 px wide, so a wide block's poster stays sharp; drawn bigger for this one frame only
		const ratio = this.renderer.getPixelRatio();
		this.renderer.setPixelRatio( ratio * Math.min( Math.max( 1, 1600 / this.canvas.width ), 4 ) );
		this.resize();
		const { width, height } = this.canvas;
		const out = this.el.ownerDocument.createElement( 'canvas' );
		out.width = width;
		out.height = height;
		const context = out.getContext( '2d' );
		const back = this.scan.look.background;
		if ( '#' === back[ 0 ] ) {
			context.fillStyle = back;
			context.fillRect( 0, 0, width, height );
		} else if ( 'transparent' !== back ) {
			// radial-gradient(120% 90% at 50% 30%, …) of .alsv_stage and .alsv_bg_light
			const colors = 'light' === back ? [ '#ffffff', '#dfe3e7' ] : [ '#353b42', '#121518' ];
			const rx = width * 1.2;
			const ry = height * 0.9;
			context.setTransform( rx, 0, 0, ry, width * 0.5, height * 0.3 );
			const gradient = context.createRadialGradient( 0, 0, 0, 0, 0, 1 );
			gradient.addColorStop( 0, colors[ 0 ] );
			gradient.addColorStop( 1, colors[ 1 ] );
			context.fillStyle = gradient;
			context.fillRect( -( width * 0.5 ) / rx, -( height * 0.3 ) / ry, width / rx, height / ry );
			context.setTransform( 1, 0, 0, 1, 0, 0 );
		}
		this.renderer.render( this.scene, this.camera );
		context.drawImage( this.canvas, 0, 0 );
		this.renderer.setPixelRatio( ratio );
		this.resize();
		// see-through stays see-through: a PNG; otherwise a JPEG, far smaller
		return 'transparent' === back ? out.toDataURL( 'image/png' ) : out.toDataURL( 'image/jpeg', 0.88 );
	}

	// the editor's questions
	onAsk( event ) {
		const { id, type } = event.detail || {};
		let answer = null;
		if ( this.ready && 'view' === type ) {
			const target = this.walking()
				? this.camera.position.clone().add( this.camera.getWorldDirection( new Vector3() ) )
				: this.controls.target;
			answer = { position: round( this.camera.position ), target: round( target ) };
		}
		if ( this.ready && 'poster' === type ) {
			answer = { image: this.snapshot() };
		}
		if ( this.ready && 'center' === type ) {
			// the shift that puts the middle of the turned and sized scan at 0, 0, 0
			const m = new Matrix4().compose( new Vector3(), this.mesh.quaternion, this.mesh.scale );
			answer = { offset: round( this.localBox.clone().applyMatrix4( m ).getCenter( new Vector3() ).negate() ) };
		}
		this.el.dispatchEvent( new this.window.CustomEvent( 'alsv:reply', { detail: { id, type, ok: !! answer, ...answer } } ) );
	}

	destroy() {
		this.resizer?.disconnect();
		this.watcher?.disconnect();
		( this.unlisten || [] ).forEach( ( off ) => off() );
		this.spots?.destroy();
		this.tools?.destroy();
		this.hint?.remove();
		if ( this.renderer ) {
			this.renderer.setAnimationLoop( null );
			this.controls.dispose();
			this.mesh?.dispose();
			this.renderer.dispose();
			this.canvas.remove();
			this.progress.remove();
		}
		this.stage.querySelector( '.alsv_note' )?.remove();
		this.el.classList.remove( 'alsv_ready', 'alsv_placing' );
	}
}
