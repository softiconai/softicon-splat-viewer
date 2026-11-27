import './public-path';
import messages from './viewer/messages';

const SELECTOR = '.alsv_viewer';

const configOf = ( el ) => {
	try {
		const config = JSON.parse( el.dataset.alsv || '{}' );
		return config && 'object' === typeof config && config.scan && 'object' === typeof config.scan ? config : null;
	} catch ( e ) {
		return null;
	}
};

const close = ( el ) => {
	el.alsvToken = ( el.alsvToken || 0 ) + 1;
	el.alsv?.destroy();
	el.alsv = null;
};

// the viewer (Spark and three) is its own chunk, loaded the first time a scan is near the screen
const loadViewer = () => import( /* webpackChunkName: "viewer" */ './viewer/Viewer' ).then( ( module ) => module.default );

// opens, updates or closes the viewer to match the block; the editor calls it again after every change.
// Until the viewer is there, the poster from render.php stays.
const sync = ( el ) => {
	const config = configOf( el );
	if ( ! config ) {
		close( el );
		return;
	}
	if ( el.alsv ) {
		el.alsv.update( config );
		return;
	}
	// the page waits for "View in 3D" when the block asks for it; the editor's preview never waits
	if ( 'click' === config.scan.loadMode && ! config.editor && ! el.alsvAsked ) {
		offer( el );
		return;
	}
	const token = el.alsvToken = ( el.alsvToken || 0 ) + 1;
	loadViewer().then( ( Viewer ) => {
		// closed, or opened again, while the chunk was loading
		if ( token === el.alsvToken && ! el.alsv ) {
			el.alsv = new Viewer( el, configOf( el ) || config, messages );
			// asked for with the keyboard: go on with the keyboard in the scan
			if ( el.alsvFocus ) {
				el.querySelector( '.alsv_canvas' )?.focus();
			}
		}
	} ).catch( () => {} );
};

// the "View in 3D" button over the poster; nothing of the viewer loads before it is pressed
const offer = ( el ) => {
	const stage = el.querySelector( '.alsv_stage' );
	if ( ! stage || stage.querySelector( '.alsv_start' ) ) {
		return;
	}
	const button = document.createElement( 'button' );
	button.type = 'button';
	button.className = 'alsv_start';
	// the block's icon, a cube of dots
	button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill-rule="evenodd" d="M12 2.2 20.5 7v10L12 21.8 3.5 17V7zm0 1.7L5 7.9v8.2l7 4 7-4V7.9z"/><circle cx="9" cy="10" r="1.3"/><circle cx="14.2" cy="9" r="1.1"/><circle cx="12" cy="13.6" r="1.5"/><circle cx="15.6" cy="13.8" r=".9"/><circle cx="9.4" cy="15.4" r=".9"/></svg>';
	button.appendChild( document.createElement( 'span' ) ).textContent = messages.start;
	button.addEventListener( 'click', ( event ) => {
		el.alsvAsked = true;
		el.alsvFocus = 0 === event.detail;
		button.remove();
		sync( el );
	} );
	stage.appendChild( button );
};

const whenNear = ( elements, callback ) => {
	if ( ! ( 'IntersectionObserver' in window ) ) {
		elements.forEach( callback );
		return;
	}
	const observer = new IntersectionObserver( ( entries ) => entries.forEach( ( entry ) => {
		if ( entry.isIntersecting ) {
			observer.unobserve( entry.target );
			callback( entry.target );
		}
	} ), { rootMargin: '300px 0px' } );
	elements.forEach( ( el ) => observer.observe( el ) );
};

// each element once, a later boot only picks up the new ones
const boot = () => {
	const all = [ ...document.querySelectorAll( SELECTOR ) ].filter( ( el ) => ! el.alsvSeen );
	all.forEach( ( el ) => {
		el.alsvSeen = true;
		// sent by the block editor's preview
		el.addEventListener( 'alsv:update', () => sync( el ) );
		el.addEventListener( 'alsv:destroy', () => close( el ) );
	} );
	whenNear( all, sync );
};

if ( 'loading' === document.readyState ) {
	document.addEventListener( 'DOMContentLoaded', boot );
} else {
	boot();
}

// for viewers added to the page later, e.g. in a popup, and for the block editor
document.addEventListener( 'alsv:boot', boot );
