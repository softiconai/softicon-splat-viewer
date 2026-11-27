import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import { BlockIcon, MediaPlaceholder, useBlockProps } from '@wordpress/block-editor';
import { Placeholder } from '@wordpress/components';
import { useMergeRefs } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
// copied from the shared softicon-tools folder by `npm run tools` (prebuild), edit it there
import useIframeAssets from '../../vendor/softicon-tools/hooks/useIframeAssets';
import Settings from './Settings/Settings';
import { blockIcon } from '../../utils/icons';
import { accept } from '../../utils/options';
import { cleanData, idOf, lookProps, newId } from '../../utils/data';
import useFilePicker from './File/useFilePicker';
import useAsk from './useAsk';

// The live viewer: view.js runs inside the editor's iframe (Block::editor_viewer()) and opens the same viewer as
// the page. The block tells it when to start, update (after every change) and stop; React never touches its DOM.
const useViewer = ( ref, key ) => {
	useEffect( () => {
		const el = ref.current;
		return () => el?.dispatchEvent( new window.Event( 'alsv:destroy' ) );
	}, [ ref ] );

	// boot first: the block may have only now got its file
	useEffect( () => {
		const el = ref.current;
		el?.ownerDocument.dispatchEvent( new window.Event( 'alsv:boot' ) );
		el?.dispatchEvent( new window.Event( 'alsv:update' ) );
	}, [ ref, key ] );
};

// Hotspots in the preview: the block tells the viewer whether "Add a hotspot" is on and which hotspot is open
// in the sidebar; the viewer tells the block (alsv:edit) where one was placed or dragged to, or which was clicked.
const useHotspots = ( ref, attributes, setAttributes, isSelected, config ) => {
	const [ placing, setPlacing ] = useState( false );
	const [ selected, setSelected ] = useState( null );
	const [ panel, setPanel ] = useState( 0 );
	const latest = useRef();
	latest.current = Array.isArray( attributes.hotspots ) ? attributes.hotspots : [];

	useEffect( () => {
		if ( ! isSelected ) {
			setPlacing( false );
		}
	}, [ isSelected ] );

	useEffect( () => {
		const el = ref.current;
		if ( ! el ) {
			return;
		}
		const onEdit = ( event ) => {
			const { action, id, position } = event.detail || {};
			const list = latest.current;
			// the sidebar opens at the new or clicked hotspot
			const show = ( spotId ) => {
				setSelected( spotId );
				setPanel( ( count ) => count + 1 );
			};
			if ( 'add' === action ) {
				const spot = { id: newId( 'h' ), type: 'info', position, title: '', text: '', imageId: 0, imageUrl: '', url: '' };
				setAttributes( { hotspots: [ ...list, spot ] } );
				setPlacing( false );
				show( spot.id );
			}
			if ( 'move' === action ) {
				// the id as cleanHotspot() makes it
				setAttributes( { hotspots: list.map( ( item, index ) => ( ( idOf( item?.id ) || 'h' + index ) === id ? { ...item, position } : item ) ) } );
			}
			if ( 'select' === action ) {
				show( id );
			}
			if ( 'cancel' === action ) {
				setPlacing( false );
			}
		};
		el.addEventListener( 'alsv:edit', onEdit );
		return () => el.removeEventListener( 'alsv:edit', onEdit );
	}, [ ref, setAttributes ] );

	// again after every change: the viewer may only now have opened
	useEffect( () => {
		const el = ref.current;
		const CustomEvent = el?.ownerDocument.defaultView.CustomEvent;
		if ( ! CustomEvent ) {
			return;
		}
		el.dispatchEvent( new CustomEvent( 'alsv:place', { detail: {
			on: placing,
			hint: __( 'Click on the scan where the hotspot goes. Esc stops.', 'softicon-splat-viewer' ),
			miss: __( 'No scan there. Click on the scan itself.', 'softicon-splat-viewer' ),
		} } ) );
		el.dispatchEvent( new CustomEvent( 'alsv:select', { detail: { id: selected } } ) );
	}, [ ref, placing, selected, config ] );

	return { placing, setPlacing, selected, setSelected, panel };
};

const Edit = ( { attributes, setAttributes, isSelected } ) => {
	// a block installed from the inserter's search gets these only in the top window
	const assetsRef = useIframeAssets( [ 'softicon-splat-viewer-style-css', 'softicon-splat-viewer-editor-style-css' ] );
	const ref = useRef();
	const pick = useFilePicker( setAttributes );
	const ask = useAsk( ref );
	// the site's viewer config (the alsv_config filter); the inserter's previews show the name only
	const { site, isPreview } = useSelect( ( select ) => {
		const settings = select( 'core/block-editor' ).getSettings();
		return { site: settings.alsv || {}, isPreview: settings.isPreviewMode };
	}, [] );

	// as render.php prints it, and hotspots not shown on the page yet (drafts)
	const scan = cleanData( attributes, true );
	const config = JSON.stringify( { ...site, scan, editor: true } );
	useViewer( ref, config );
	const hotspots = useHotspots( ref, attributes, setAttributes, isSelected, config );

	const look = scan ? lookProps( scan.look ) : null;
	const blockProps = useBlockProps( {
		ref: useMergeRefs( [ assetsRef, ref ] ),
		className: scan ? ( 'alsv_viewer ' + look.className ).trim() : undefined,
		style: look?.style,
		'data-alsv': scan && ! isPreview ? config : undefined,
	} );

	const empty = isPreview
		? <Placeholder icon={ <BlockIcon icon={ blockIcon } /> } label={ __( 'Splat Viewer', 'softicon-splat-viewer' ) } />
		: <MediaPlaceholder
			icon={ <BlockIcon icon={ blockIcon } /> }
			labels={ {
				title: __( 'Splat Viewer', 'softicon-splat-viewer' ),
				instructions: __( 'Upload a 3D scan (Gaussian splat) or choose one from the Media Library: .spz, .ply, .splat, .ksplat or .sog. Phone apps such as Scaniverse, Polycam or Luma make these files.', 'softicon-splat-viewer' ),
			} }
			accept={ accept }
			onSelect={ pick }
			onSelectURL={ pick }
		/>;

	return <>
		{ scan && <Settings { ...{ attributes, setAttributes, scan, ask, ...hotspots } } /> }

		<div { ...blockProps }>
			{ scan
				? <div className="alsv_stage">
					{ scan.poster.url
						? <img className="alsv_poster" src={ scan.poster.url } alt={ scan.poster.alt } />
						: <span className="alsv_name">{ scan.file.url.split( /[?#]/ )[ 0 ].split( '/' ).pop() }</span> }
				</div>
				: empty }
		</div>
	</>;
};

export default Edit;
