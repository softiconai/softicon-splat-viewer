import { useCallback } from '@wordpress/element';

let last = 0;

// Asks the viewer in the editor iframe something it alone knows (the current view, the scan's middle).
// It answers with an alsv:reply event on the block; null when no viewer answers in time (wait, in ms).
const useAsk = ( ref ) => useCallback( ( type, wait = 3000 ) => new Promise( ( resolve ) => {
	const el = ref.current;
	if ( ! el ) {
		resolve( null );
		return;
	}
	const id = ++last;
	let timer = 0;
	const onReply = ( event ) => {
		if ( event.detail?.id === id ) {
			done( event.detail.ok ? event.detail : null );
		}
	};
	const done = ( value ) => {
		el.removeEventListener( 'alsv:reply', onReply );
		window.clearTimeout( timer );
		resolve( value );
	};
	timer = window.setTimeout( () => done( null ), wait );
	el.addEventListener( 'alsv:reply', onReply );
	el.dispatchEvent( new el.ownerDocument.defaultView.CustomEvent( 'alsv:ask', { detail: { id, type } } ) );
} ), [ ref ] );

export default useAsk;
