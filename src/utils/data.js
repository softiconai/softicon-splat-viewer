// the editor's copy of Block::data() in includes/class-block.php: what the page will show. Change both together.

// the same lists and numbers are in includes/class-block.php
export const formats = [ 'spz', 'ply', 'splat', 'ksplat', 'sog' ];
export const maxHotspots = 50;
export const hotspotTypes = [ 'info', 'link' ];
export const cameraModes = [ 'orbit', 'walk' ];
export const loadModes = [ 'visible', 'click' ];
export const qualities = [ 'auto', 'high', 'low' ];
export const backgrounds = [ 'dark', 'light', 'transparent' ];
const FAR = 10000;

// like wp_strip_all_tags(): tags go, and so does what is inside script and style; a < that starts no tag
// (followed by a space, or never closed) stays, as in PHP
const strip = ( value ) => value.replace( /<(script|style)[^>]*?>[\s\S]*?<\/\1>/gi, '' ).replace( /<(?!\s)[^>]*>/g, '' );

export const text = ( value ) => ( 'string' === typeof value || 'number' === typeof value ? strip( String( value ) ).trim() : '' );

// as sanitize_text_field() leaves it (no %xx codes, single spaces), at most max characters
export const line = ( value, max ) => [ ...text( value ).replace( /%[a-f0-9]{2}/gi, '' ).replace( /\s+/g, ' ' ).trim() ].slice( 0, max ).join( '' );

// as sanitize_textarea_field() leaves it: line breaks stay
const lines = ( value, max ) => [ ...text( value ).replace( /%[a-f0-9]{2}/gi, '' ) ].slice( 0, max ).join( '' );

// as sanitize_key() keeps it
export const idOf = ( value ) => text( value ).toLowerCase().replace( /[^a-z0-9_-]/g, '' ).slice( 0, 40 );

const round = ( value ) => Math.round( value * 1000 ) / 1000;

const isObject = ( value ) => !! value && 'object' === typeof value && ! Array.isArray( value );
const part = ( value ) => ( isObject( value ) ? value : {} );

// a number in min..max, or null; strings as PHP's is_numeric() takes them
export const num = ( value, min, max ) => {
	const number = 'string' === typeof value && /^\s*[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?\s*$/i.test( value ) ? Number( value ) : value;
	return 'number' === typeof number && Number.isFinite( number ) && number >= min && number <= max ? round( number ) : null;
};

const flag = ( value, fallback ) => ( 'boolean' === typeof value ? value : fallback );

// as Block::text() reads a word: trimmed only, tags and all (a choice with a tag in it is no choice)
const plain = ( value ) => ( 'string' === typeof value || 'number' === typeof value ? String( value ).trim() : '' );

const pick = ( value, list ) => ( list.includes( plain( value ) ) ? plain( value ) : list[ 0 ] );

// three numbers, or null
export const vec = ( value ) => {
	const list = Array.isArray( value ) || isObject( value ) ? Object.values( value ) : [];
	if ( 3 !== list.length ) {
		return null;
	}
	const out = list.map( ( item ) => num( item, -FAR, FAR ) );
	return out.includes( null ) ? null : out;
};

// a http(s) address with a host, or one on this site, or ''
export const link = ( value ) => {
	const raw = text( value );
	if ( ! raw ) {
		return '';
	}
	if ( /^[/#?]/.test( raw ) ) {
		return raw;
	}
	try {
		const url = new URL( /^[a-z][a-z0-9+.-]*:/i.test( raw ) ? raw : 'http://' + raw );
		return [ 'http:', 'https:' ].includes( url.protocol ) && url.host ? url.href : '';
	} catch ( e ) {
		return '';
	}
};

// as absint() on a scalar; anything else is 0
const absint = ( value ) => {
	if ( 'boolean' === typeof value ) {
		return value ? 1 : 0;
	}
	return 'string' === typeof value || 'number' === typeof value ? Math.abs( parseInt( value, 10 ) ) || 0 : 0;
};

// the format from the file's name when none is given: x.ply, x.compressed.ply
export const formatOf = ( format, url ) => {
	const given = plain( format ).toLowerCase();
	if ( formats.includes( given ) ) {
		return given;
	}
	const name = ( text( url ).split( /[?#]/ )[ 0 ].split( '/' ).pop() || '' ).toLowerCase();
	const ext = name.includes( '.' ) ? name.split( '.' ).pop() : '';
	return formats.includes( ext ) ? ext : '';
};

// null without a usable file
export const cleanFile = ( raw ) => {
	const value = part( raw );
	const url = link( value.url );
	const format = url ? formatOf( value.format, url ) : '';
	return format ? { id: absint( value.id ), url, format } : null;
};

export const cleanTransform = ( raw ) => {
	const value = part( raw );
	return {
		rotX: num( value.rotX, -180, 180 ) ?? 0,
		rotY: num( value.rotY, -180, 180 ) ?? 0,
		rotZ: num( value.rotZ, -180, 180 ) ?? 0,
		scale: num( value.scale, 0.001, 1000 ) ?? 1,
		offset: vec( value.offset ) ?? [ 0, 0, 0 ],
	};
};

// no position or target: the viewer frames the scan itself
export const cleanCamera = ( raw ) => {
	const value = part( raw );
	return {
		mode: pick( value.mode, cameraModes ),
		position: vec( value.position ),
		target: vec( value.target ),
		fov: num( value.fov, 20, 120 ) ?? 50,
		autoRotate: flag( value.autoRotate, false ),
		speed: num( value.speed, 0.1, 10 ) ?? 1,
		zoom: flag( value.zoom, true ),
	};
};

// null when the hotspot has no place, no type or nothing to show; the editor's preview (drafts) keeps one
// with nothing to show yet, marked draft, so a new hotspot is there the moment it is placed
export const cleanHotspot = ( raw, index, drafts = false ) => {
	const value = part( raw );
	const type = plain( value.type );
	const position = vec( value.position );
	if ( ! hotspotTypes.includes( type ) || null === position ) {
		return null;
	}
	const spot = {
		id: idOf( value.id ) || 'h' + index,
		type,
		position,
		title: line( value.title, 200 ),
		text: lines( value.text, 500 ),
		imageId: absint( value.imageId ),
		imageUrl: link( value.imageUrl ),
		url: link( value.url ),
	};
	const shows = 'link' === type ? !! spot.url : !! ( spot.title + spot.text + spot.imageUrl );
	if ( shows ) {
		return spot;
	}
	return drafts ? { ...spot, draft: true } : null;
};

// each id once
export const cleanHotspots = ( list, drafts = false ) => {
	const spots = new Map();
	( Array.isArray( list ) ? list.slice( 0, maxHotspots ) : [] ).forEach( ( raw, index ) => {
		const spot = cleanHotspot( raw, index, drafts );
		if ( spot && ! spots.has( spot.id ) ) {
			spots.set( spot.id, spot );
		}
	} );
	return [ ...spots.values() ];
};

export const cleanPoster = ( raw ) => {
	const value = part( raw );
	const url = link( value.url );
	return { id: url ? absint( value.id ) : 0, url, alt: line( value.alt, 300 ) };
};

// a CSS height: 480, 480px or 70vh; '' for the default
export const heightOf = ( value ) => {
	const match = plain( value ).replace( / /g, '' ).toLowerCase().match( /^(\d{1,4})(px|vh)?$/ );
	if ( ! match ) {
		return '';
	}
	const number = parseInt( match[ 1 ], 10 );
	const unit = match[ 2 ] || 'px';
	const fits = 'px' === unit ? number >= 100 && number <= 3000 : number >= 10 && number <= 100;
	return fits ? number + unit : '';
};

// #abc or #aabbcc, in small letters; '' when it is no color
export const colorOf = ( value ) => {
	const color = plain( value ).toLowerCase();
	return /^#([0-9a-f]{3}|[0-9a-f]{6})$/.test( color ) ? color : '';
};

// how the viewer looks: its size, corners and colors, and how sharp it draws
export const cleanLook = ( value ) => {
	const background = plain( value.background );
	return {
		height: heightOf( value.height ),
		mobileHeight: heightOf( value.mobileHeight ),
		radius: num( value.radius, 0, 100 ) ?? 12,
		background: backgrounds.includes( background ) ? background : colorOf( background ) || 'dark',
		hotspotColor: colorOf( value.hotspotColor ),
		quality: pick( value.quality, qualities ),
	};
};

// the visitor's buttons
export const cleanToolbar = ( value ) => ( {
	reset: flag( value.showReset, true ),
	fullscreen: flag( value.showFullscreen, true ),
	hotspots: flag( value.showHotspotToggle, true ),
	autoRotate: flag( value.showAutoRotate, false ),
	mode: flag( value.showModeSwitch, false ),
} );

// what the page shows, or null without a file; drafts: the editor's preview, see cleanHotspot()
export const cleanData = ( attributes, drafts = false ) => {
	const value = part( attributes );
	const file = cleanFile( value.file );
	if ( ! file ) {
		return null;
	}
	return {
		file,
		transform: cleanTransform( value.transform ),
		camera: cleanCamera( value.camera ),
		hotspots: cleanHotspots( value.hotspots, drafts ),
		poster: cleanPoster( value.poster ),
		loadMode: pick( value.loadMode, loadModes ),
		look: cleanLook( value ),
		toolbar: cleanToolbar( value ),
	};
};

// a new id, as sanitize_key() keeps it
export const newId = ( prefix ) => prefix + Math.random().toString( 36 ).slice( 2, 10 );

// a scan file from a Media Library item or a pasted address; null when it is no splat file
export const fileFromMedia = ( media ) => {
	const url = 'string' === typeof media ? media : media?.url;
	const format = formatOf( '', url );
	return format ? { id: 'string' === typeof media ? 0 : absint( media?.id ), url: link( url ), format } : null;
};

// the look as CSS variables and a class (style.scss), as render.php prints them
export const lookProps = ( look ) => {
	const style = { '--alsv-radius': look.radius + 'px' };
	[ [ 'height', '--alsv-height' ], [ 'mobileHeight', '--alsv-height-m' ], [ 'hotspotColor', '--alsv-spot' ] ].forEach( ( [ key, name ] ) => {
		if ( look[ key ] ) {
			style[ name ] = look[ key ];
		}
	} );
	let className = '';
	if ( '#' === look.background[ 0 ] ) {
		style[ '--alsv-bg' ] = look.background;
	} else if ( 'dark' !== look.background ) {
		className = 'alsv_bg_' + look.background;
	}
	return { className, style };
};
