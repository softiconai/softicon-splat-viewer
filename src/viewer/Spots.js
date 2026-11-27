// The hotspots: buttons and links over the canvas that follow points on the scan, and the card an info hotspot
// opens. Their places are in the scan's own coordinates, so they turn and move with it. In the editor they can
// be dragged, and a click on the scan places a new one; the block hears of both through alsv:edit events.
import { Raycaster, Vector2, Vector3 } from 'three';

const round = ( vector ) => vector.toArray().map( ( value ) => Math.round( value * 1000 ) / 1000 );

const make = ( doc, tag, className, parent ) => {
	const el = doc.createElement( tag );
	el.className = className;
	parent?.appendChild( el );
	return el;
};

export default class Spots {
	constructor( viewer ) {
		this.viewer = viewer;
		this.doc = viewer.el.ownerDocument;
		this.items = [];
		this.key = '';
		this.selected = null;
		this.raycaster = new Raycaster();
		this.world = new Vector3();
		this.next = 0;
		this.layer = make( this.doc, 'div', 'alsv_spots', viewer.stage );
		this.layer.hidden = true;
		this.popupEvents();
	}

	// the scan point under a place on the canvas, in the scan's own coordinates, or null
	pick( x, y ) {
		const { canvas, camera, mesh } = this.viewer;
		const rect = canvas.getBoundingClientRect();
		const point = new Vector2( ( ( ( x - rect.left ) / rect.width ) * 2 ) - 1, 1 - ( ( ( y - rect.top ) / rect.height ) * 2 ) );
		this.raycaster.setFromCamera( point, camera );
		this.raycaster.near = 0;
		this.raycaster.far = Infinity;
		const hits = [];
		mesh.raycast( this.raycaster, hits );
		if ( ! hits.length ) {
			return null;
		}
		const nearest = hits.reduce( ( a, b ) => ( b.distance < a.distance ? b : a ) );
		return round( mesh.worldToLocal( nearest.point.clone() ) );
	}

	// tell the block (editor only)
	tell( action, detail ) {
		this.viewer.el.dispatchEvent( new this.viewer.window.CustomEvent( 'alsv:edit', { detail: { action, ...detail } } ) );
	}

	// the block's hotspots; built again only when they change
	set( list, editor ) {
		const key = JSON.stringify( [ list, editor ] );
		if ( key === this.key ) {
			return;
		}
		this.key = key;
		this.editor = editor;
		const open = this.open?.spot.id;
		this.close( false );
		this.items.forEach( ( item ) => item.el.remove() );
		this.items = list.map( ( spot, index ) => this.item( spot, index ) );
		const again = this.items.find( ( item ) => item.spot.id === open );
		if ( again ) {
			this.show( again, false );
		}
		this.select( this.selected );
	}

	item( spot, index ) {
		const { messages } = this.viewer;
		const isLink = 'link' === spot.type && ! this.editor;
		const el = make( this.doc, isLink ? 'a' : 'button', 'alsv_spot alsv_spot_' + spot.type + ( spot.draft ? ' alsv_spot_draft' : '' ), this.layer );
		const name = spot.title || ( 'link' === spot.type ? spot.url : messages.spot( index + 1 ) );
		if ( isLink ) {
			el.href = spot.url;
		} else {
			el.type = 'button';
			if ( 'info' === spot.type ) {
				el.setAttribute( 'aria-expanded', 'false' );
			}
		}
		el.setAttribute( 'aria-label', name );
		make( this.doc, 'span', 'alsv_spot_dot', el ).textContent = String( index + 1 );
		if ( spot.title ) {
			const label = make( this.doc, 'span', 'alsv_spot_label', el );
			label.textContent = spot.title;
			label.setAttribute( 'aria-hidden', 'true' );
		}
		const item = { spot, el, local: new Vector3( ...spot.position ), seen: '', behind: false };
		this.itemEvents( item );
		return item;
	}

	itemEvents( item ) {
		const { el } = item;
		let start = null;
		let moved = false;
		el.addEventListener( 'pointerdown', ( event ) => {
			if ( ! this.editor || 0 !== event.button ) {
				return;
			}
			// dragging a hotspot must not turn the scan
			event.preventDefault();
			el.setPointerCapture( event.pointerId );
			start = [ event.clientX, event.clientY ];
			moved = false;
		} );
		el.addEventListener( 'pointermove', ( event ) => {
			if ( ! start || ( ! moved && Math.hypot( event.clientX - start[ 0 ], event.clientY - start[ 1 ] ) < 5 ) ) {
				return;
			}
			moved = true;
			el.classList.add( 'alsv_spot_moving' );
			const point = this.pick( event.clientX, event.clientY );
			if ( point ) {
				item.local.set( ...point );
				item.seen = '';
			}
		} );
		const up = () => {
			if ( start && moved ) {
				el.classList.remove( 'alsv_spot_moving' );
				this.tell( 'move', { id: item.spot.id, position: round( item.local ) } );
			}
			start = null;
		};
		el.addEventListener( 'pointerup', up );
		el.addEventListener( 'pointercancel', up );
		el.addEventListener( 'click', ( event ) => {
			if ( moved ) {
				moved = false;
				event.preventDefault();
				return;
			}
			if ( this.editor ) {
				this.tell( 'select', { id: item.spot.id } );
			}
			if ( 'info' === item.spot.type ) {
				// opened from the keyboard: the card's close button gets the focus
				this.toggle( item, 0 === event.detail );
			}
		} );
		el.addEventListener( 'keydown', ( event ) => {
			if ( 'Escape' === event.key && this.open ) {
				this.close( true );
			}
		} );
	}

	// the card an info hotspot opens
	popupEvents() {
		const doc = this.doc;
		const popup = make( doc, 'div', 'alsv_popup', this.viewer.stage );
		popup.hidden = true;
		popup.setAttribute( 'role', 'dialog' );
		popup.id = 'alsv-popup-' + Math.random().toString( 36 ).slice( 2, 9 );
		const close = make( doc, 'button', 'alsv_popup_close', popup );
		close.type = 'button';
		close.setAttribute( 'aria-label', this.viewer.messages.close );
		close.textContent = '×';
		close.addEventListener( 'click', () => this.close( true ) );
		this.image = make( doc, 'img', 'alsv_popup_image', popup );
		this.image.alt = '';
		this.title = make( doc, 'div', 'alsv_popup_title', popup );
		this.title.id = popup.id + '-title';
		this.text = make( doc, 'p', 'alsv_popup_text', popup );
		popup.addEventListener( 'keydown', ( event ) => {
			if ( 'Escape' === event.key ) {
				this.close( true );
			}
		} );
		this.popup = popup;
		this.closeButton = close;
	}

	toggle( item, focus ) {
		if ( this.open === item ) {
			this.close( false );
		} else {
			this.show( item, focus );
		}
	}

	show( item, focus ) {
		this.close( false );
		const { spot, el } = item;
		this.open = item;
		this.image.hidden = ! spot.imageUrl;
		if ( spot.imageUrl ) {
			this.image.src = spot.imageUrl;
		}
		this.title.hidden = ! spot.title;
		this.title.textContent = spot.title;
		this.text.hidden = ! spot.text;
		this.text.textContent = spot.text;
		if ( spot.title ) {
			this.popup.setAttribute( 'aria-labelledby', this.title.id );
			this.popup.removeAttribute( 'aria-label' );
		} else {
			this.popup.setAttribute( 'aria-label', el.getAttribute( 'aria-label' ) );
			this.popup.removeAttribute( 'aria-labelledby' );
		}
		this.popup.hidden = false;
		el.setAttribute( 'aria-expanded', 'true' );
		el.setAttribute( 'aria-controls', this.popup.id );
		el.classList.add( 'alsv_spot_open' );
		if ( focus ) {
			this.closeButton.focus();
		}
	}

	// back: the focus goes back to the hotspot
	close( back ) {
		const item = this.open;
		this.open = null;
		this.popup.hidden = true;
		if ( ! item ) {
			return;
		}
		item.el.setAttribute( 'aria-expanded', 'false' );
		item.el.classList.remove( 'alsv_spot_open' );
		if ( back ) {
			item.el.focus();
		}
	}

	// the hotspot open in the editor's sidebar
	select( id ) {
		this.selected = id;
		this.items.forEach( ( item ) => item.el.classList.toggle( 'alsv_spot_selected', item.spot.id === id ) );
	}

	// every frame: each hotspot where its point is on the screen, then check() for hotspots behind the scan
	frame() {
		const { camera, mesh, ready, stage } = this.viewer;
		this.layer.hidden = ! ready || ! this.items.length;
		if ( this.layer.hidden ) {
			return;
		}
		const width = stage.clientWidth;
		const height = stage.clientHeight;
		// the view, to a thousandth of the scan's size: the end of a damped turn counts as still
		const unit = this.viewer.radius / 1000;
		const view = camera.position.toArray().map( ( value ) => Math.round( value / unit ) ).concat( round( camera.quaternion ) ).join() + mesh.matrixWorld.elements.join();
		this.items.forEach( ( item ) => {
			const world = item.local.clone().applyMatrix4( mesh.matrixWorld );
			const screen = world.clone().project( camera );
			const out = screen.z > 1 || screen.z < -1 || Math.abs( screen.x ) > 1.05 || Math.abs( screen.y ) > 1.05;
			item.el.style.visibility = out ? 'hidden' : '';
			if ( ! out ) {
				item.el.style.transform = `translate(${ Math.round( ( screen.x + 1 ) * width / 2 ) }px, ${ Math.round( ( 1 - screen.y ) * height / 2 ) }px)`;
			}
			item.world = world;
		} );
		this.check( view );
	}

	// A ray through all splats takes ~10 ms for 180k splats, far more for a big phone scan, so the checks wait
	// until the view has stood still for 300 ms (never while turning on its own), and a slow ray waits longer
	check( view ) {
		const now = this.viewer.window.performance.now();
		if ( view !== this.view ) {
			this.view = view;
			this.still = now;
			return;
		}
		if ( now - this.still < 300 || now < this.wait ) {
			return;
		}
		const count = this.items.length;
		for ( let tries = 0; tries < count; tries++ ) {
			const item = this.items[ this.next++ % count ];
			if ( item.seen !== view ) {
				item.seen = view;
				this.hide( item );
				const cost = this.viewer.window.performance.now() - now;
				this.wait = now + ( cost > 20 ? cost * 3 : 0 );
				break;
			}
		}
	}

	// dim a hotspot when the scan is between it and the camera
	hide( item ) {
		const { camera, mesh, radius } = this.viewer;
		const direction = item.world.clone().sub( camera.position );
		const distance = direction.length();
		this.raycaster.set( camera.position, direction.normalize() );
		this.raycaster.near = 0;
		this.raycaster.far = Math.max( distance - ( radius * 0.03 ), 0 );
		const hits = [];
		if ( this.raycaster.far > 0 ) {
			mesh.raycast( this.raycaster, hits );
		}
		item.behind = hits.length > 0;
		item.el.classList.toggle( 'alsv_spot_behind', item.behind );
	}

	destroy() {
		this.layer.remove();
		this.popup.remove();
	}
}
