import { SVG, Path, Circle } from '@wordpress/primitives';

// a cube made of soft dots: a 3D scan
export const blockIcon = <SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
	<Path fillRule="evenodd" d="M12 2.2 20.5 7v10L12 21.8 3.5 17V7zm0 1.7L5 7.9v8.2l7 4 7-4V7.9z" />
	<Circle cx="9" cy="10" r="1.3" />
	<Circle cx="14.2" cy="9" r="1.1" />
	<Circle cx="12" cy="13.6" r="1.5" />
	<Circle cx="15.6" cy="13.8" r="0.9" />
	<Circle cx="9.4" cy="15.4" r="0.9" />
</SVG>;

export const path = ( d ) => <SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><Path d={ d } /></SVG>;

export const icons = {
	upload: path( 'M12 3.5 7 8.5l1.4 1.4L11 7.3V16h2V7.3l2.6 2.6L17 8.5zM5 18h14v2H5z' ),
	remove: path( 'M7 6h10v1.5H7zm2-2h6v1.5H9zM8 9h8l-.7 10H8.7z' ),
	// an object with a ring around it
	orbit: <SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
		<Path fillRule="evenodd" d="M12 7.5c-5 0-9 2-9 4.5s4 4.5 9 4.5 9-2 9-4.5-4-4.5-9-4.5m0 1.5c4.2 0 7.5 1.6 7.5 3s-3.3 3-7.5 3-7.5-1.6-7.5-3 3.3-3 7.5-3" />
		<Circle cx="12" cy="12" r="2.2" />
	</SVG>,
	// a person walking
	walk: path( 'M13.5 5.5a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0M11 8.5l-3 1.6V13h1.5v-2l1.3-.6-1.3 6L6.6 18l.8 1.3 3.5-2 .9-3 1.7 1.7V21H15v-5.6l-1.8-1.8.6-2.6.8 1.4H17V11h-1.6l-1.2-2.1c-.4-.7-1-.9-1.6-.8z' ),
	add: path( 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z' ),
	// an i in a circle: a card with text
	info: path( 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18m0 1.6a7.4 7.4 0 1 1 0 14.8 7.4 7.4 0 0 1 0-14.8M11.2 10h1.6v6.5h-1.6zm.8-3a1 1 0 1 1 0 2 1 1 0 0 1 0-2' ),
	link: path( 'M10.6 13.4a1 1 0 0 1 0-1.4l3.3-3.3a2.5 2.5 0 1 1 3.5 3.5l-2 2-1.1-1 2-2a1 1 0 0 0-1.4-1.5L11.6 13a1 1 0 0 1-1 .4M13.4 10.6a1 1 0 0 1 0 1.4l-3.3 3.3a2.5 2.5 0 1 1-3.5-3.5l2-2 1.1 1-2 2a1 1 0 0 0 1.4 1.5l3.3-3.3a1 1 0 0 1 1-.4' ),
	// backgrounds: a filled, an empty and a crossed-out square
	dark: path( 'M4 4h16v16H4z' ),
	light: path( 'M4 4h16v16H4zm1.5 1.5v13h13v-13z' ),
	none: path( 'M4 4h16v16H4zm1.5 1.5v11.4L16.9 5.5zm13 1.6L7.1 18.5h11.4z' ),
	eye: path( 'M12 5C6.5 5 3 12 3 12s3.5 7 9 7 9-7 9-7-3.5-7-9-7m0 2c3.6 0 6.2 3.8 6.9 5-.7 1.2-3.3 5-6.9 5s-6.2-3.8-6.9-5C5.8 10.8 8.4 7 12 7m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6' ),
	click: path( 'M9 3h2v4H9zM4.2 5.6l1.4-1.4 2.8 2.8L7 8.4zM3 11v-2h4v2zm7 0 10 4-4 1.5 3 3-1.5 1.5-3-3L13 21z' ),
	camera: path( 'M9 5 7.6 7H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2.6L15 5zm3 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8m0 1.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5' ),
};
