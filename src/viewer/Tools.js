// The visitor's buttons in the corner: back to the start view, full screen, hotspots on or off, turning on its
// own, and walking inside. The block picks which ones show (scan.toolbar); each one says its state to screen readers.

const svg = ( d ) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${ d }"/></svg>`;

const ICONS = {
	reset: svg( 'M12 5V2L8 6l4 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7' ),
	fullscreen: svg( 'M4 4h6v2H6v4H4zm10 0h6v6h-2V6h-4zM4 14h2v4h4v2H4zm14 0h2v6h-6v-2h4z' ),
	hotspots: svg( 'M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7m0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5' ),
	autoRotate: svg( 'M12 6c-4.4 0-8 1.8-8 4 0 1.8 2.4 3.3 5.7 3.8L8 15.5l1.4 1.4 4-4-4-4L8 10.3l1.3 1.3C7 11.2 6 10.5 6 10c0-.8 2.5-2 6-2s6 1.2 6 2c0 .5-1 1.2-3 1.6v2c3-.6 5-2 5-3.6 0-2.2-3.6-4-8-4' ),
	walk: svg( 'M13.5 5.5a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0M11 8.5l-3 1.6V13h1.5v-2l1.3-.6-1.3 6L6.6 18l.8 1.3 3.5-2 .9-3 1.7 1.7V21H15v-5.6l-1.8-1.8.6-2.6.8 1.4H17V11h-1.6l-1.2-2.1c-.4-.7-1-.9-1.6-.8z' ),
};

export default class Tools {
	constructor( viewer ) {
		this.viewer = viewer;
		this.el = viewer.el;
		this.doc = viewer.el.ownerDocument;
		this.bar = this.doc.createElement( 'div' );
		this.bar.className = 'alsv_toolbar';
		viewer.stage.appendChild( this.bar );
		this.buttons = {};
		this.key = '';
		viewer.listen( this.doc, 'fullscreenchange', () => this.sync() );
		// Esc leaves the page-wide full screen, as it does the browser's own
		viewer.listen( this.doc, 'keydown', ( event ) => {
			if ( 'Escape' === event.key && this.el.classList.contains( 'alsv_full' ) ) {
				this.el.classList.remove( 'alsv_full' );
				this.sync();
			}
		} );
	}

	// the buttons the block asked for; built again only when that changes
	set( toolbar, hotspots ) {
		const { messages } = this.viewer;
		const list = [
			[ 'reset', toolbar.reset, false ],
			[ 'hotspots', toolbar.hotspots && hotspots, true ],
			[ 'autoRotate', toolbar.autoRotate, true ],
			[ 'walk', toolbar.mode, true ],
			[ 'fullscreen', toolbar.fullscreen, true ],
		].filter( ( [ , show ] ) => show );
		const key = list.map( ( [ name ] ) => name ).join();
		if ( key !== this.key ) {
			this.key = key;
			this.bar.textContent = '';
			this.buttons = {};
			list.forEach( ( [ name, , toggle ] ) => {
				const button = this.doc.createElement( 'button' );
				button.type = 'button';
				button.className = 'alsv_tool alsv_tool_' + name;
				button.innerHTML = ICONS[ name ];
				button.setAttribute( 'aria-label', messages[ name ] );
				button.title = messages[ name ];
				if ( toggle ) {
					button.setAttribute( 'aria-pressed', 'false' );
				}
				button.addEventListener( 'click', () => this.press( name ) );
				this.bar.appendChild( button );
				this.buttons[ name ] = button;
			} );
			this.bar.hidden = ! list.length;
		}
		this.sync();
	}

	press( name ) {
		const viewer = this.viewer;
		if ( 'reset' === name ) {
			viewer.reset();
		}
		if ( 'hotspots' === name ) {
			this.el.classList.toggle( 'alsv_spots_off' );
		}
		if ( 'autoRotate' === name ) {
			// start or stop where the view is now
			viewer.spin = ! viewer.controls.autoRotate;
			viewer.controls.autoRotate = viewer.spin && ! viewer.walking();
		}
		if ( 'walk' === name ) {
			viewer.mode = viewer.walking() ? 'orbit' : 'walk';
			viewer.reset();
		}
		if ( 'fullscreen' === name ) {
			this.fullscreen();
		}
		this.sync();
	}

	// the browser's full screen, or the viewer over the whole page where there is none (iPhone) or it is not
	// allowed (a frame)
	fullscreen() {
		const el = this.el;
		if ( this.doc.fullscreenElement === el ) {
			this.doc.exitFullscreen();
			return;
		}
		if ( el.classList.contains( 'alsv_full' ) ) {
			el.classList.remove( 'alsv_full' );
			return;
		}
		const page = () => {
			el.classList.add( 'alsv_full' );
			this.sync();
		};
		if ( el.requestFullscreen ) {
			el.requestFullscreen().catch( page );
		} else {
			page();
		}
	}

	// each toggle's state, after any change
	sync() {
		const viewer = this.viewer;
		this.full = this.doc.fullscreenElement === this.el || this.el.classList.contains( 'alsv_full' );
		const pressed = {
			hotspots: ! this.el.classList.contains( 'alsv_spots_off' ),
			autoRotate: !! viewer.controls?.autoRotate,
			walk: viewer.walking(),
			fullscreen: this.full,
		};
		Object.entries( pressed ).forEach( ( [ name, on ] ) => this.buttons[ name ]?.setAttribute( 'aria-pressed', on ? 'true' : 'false' ) );
		// turning on its own is for going around the scan, not inside it
		if ( this.buttons.autoRotate ) {
			this.buttons.autoRotate.hidden = viewer.walking();
		}
	}

	destroy() {
		this.el.classList.remove( 'alsv_full', 'alsv_spots_off' );
		if ( this.doc.fullscreenElement === this.el ) {
			this.doc.exitFullscreen();
		}
		this.bar.remove();
	}
}
