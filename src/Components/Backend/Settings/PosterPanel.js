import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { Button, TextControl } from '@wordpress/components';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { FieldHead, Panel } from '../../../vendor/softicon-tools/components/Panels';
import { icons } from '../../../utils/icons';

// a data: URL from the viewer as a file to upload
const fileOf = ( dataUrl, name ) => {
	const bytes = window.atob( dataUrl.split( ',' )[ 1 ] || '' );
	const data = new Uint8Array( bytes.length );
	for ( let i = 0; i < bytes.length; i++ ) {
		data[ i ] = bytes.charCodeAt( i );
	}
	const type = dataUrl.slice( 5, dataUrl.indexOf( ';' ) );
	return new window.File( [ data ], name + ( 'image/png' === type ? '.png' : '.jpg' ), { type } );
};

// The picture shown until the scan has loaded, to visitors whose browser cannot show 3D, and to search engines:
// the preview's current view saved to the Media Library, or any image.
const PosterPanel = ( { attributes, setAttributes, scan, ask } ) => {
	const poster = scan.poster;
	// as stored: the cleaned copy would eat a space typed at the end
	const stored = attributes.poster && 'object' === typeof attributes.poster && ! Array.isArray( attributes.poster ) ? attributes.poster : {};
	const alt = 'string' === typeof stored.alt ? stored.alt : '';
	const [ busy, setBusy ] = useState( false );
	const { createWarningNotice, createSuccessNotice } = useDispatch( 'core/notices' );
	const mediaUpload = useSelect( ( select ) => select( 'core/block-editor' ).getSettings().mediaUpload, [] );
	const set = ( change ) => setAttributes( { poster: { ...stored, ...change } } );
	const failed = ( message ) => {
		setBusy( false );
		createWarningNotice( message || __( 'The poster could not be saved.', 'softicon-splat-viewer' ), { type: 'snackbar' } );
	};

	const capture = async () => {
		setBusy( true );
		// one frame can take a while on a slow computer
		const answer = await ask( 'poster', 15000 );
		if ( ! answer?.image ) {
			failed( __( 'Wait until the scan has loaded in the preview, then try again.', 'softicon-splat-viewer' ) );
			return;
		}
		const name = ( scan.file.url.split( /[?#]/ )[ 0 ].split( '/' ).pop() || 'scan' ).replace( /\.[a-z0-9]+$/i, '' ) + '-poster';
		mediaUpload( {
			filesList: [ fileOf( answer.image, name ) ],
			allowedTypes: [ 'image' ],
			// first with a temporary blob: address, then with the saved image
			onFileChange: ( [ media ] ) => {
				if ( media?.id ) {
					set( { id: media.id, url: media.url } );
					setBusy( false );
					createSuccessNotice( __( 'Poster saved to the Media Library.', 'softicon-splat-viewer' ), { type: 'snackbar' } );
				}
			},
			onError: ( message ) => failed( 'string' === typeof message ? message : message?.message ),
		} );
	};

	return <Panel id="poster" title={ __( 'Poster', 'softicon-splat-viewer' ) }>
		<div>
			<FieldHead
				label={ __( 'Picture', 'softicon-splat-viewer' ) }
				tip={ __( 'Shown until the 3D scan has loaded, to visitors whose browser cannot show 3D, and to search engines.', 'softicon-splat-viewer' ) }
			/>
			{ poster.url && <img className="alsvSpotImage" src={ poster.url } alt="" /> }
			<MediaUploadCheck>
				<div className="alsvButtons">
					{ mediaUpload && <Button variant="secondary" icon={ icons.camera } isBusy={ busy } disabled={ busy } onClick={ capture }>
						{ __( 'Use the current view', 'softicon-splat-viewer' ) }
					</Button> }
					<MediaUpload
						allowedTypes={ [ 'image' ] }
						value={ poster.id || undefined }
						onSelect={ ( media ) => set( { id: media.id, url: media.url, alt: alt || media.alt || '' } ) }
						render={ ( { open } ) => <Button variant="tertiary" onClick={ open } disabled={ busy }>
							{ __( 'Choose an image', 'softicon-splat-viewer' ) }
						</Button> }
					/>
					{ poster.url && <Button variant="tertiary" isDestructive onClick={ () => setAttributes( { poster: { alt } } ) } disabled={ busy }>
						{ __( 'Remove', 'softicon-splat-viewer' ) }
					</Button> }
				</div>
			</MediaUploadCheck>
			{ ! poster.url && <p className="alsvHelp">{ __( 'Turn the scan in the preview until it looks right, then press "Use the current view".', 'softicon-splat-viewer' ) }</p> }
		</div>
		<TextControl
			label={ __( 'Description (alt text)', 'softicon-splat-viewer' ) }
			help={ __( 'What the scan shows, for visitors who cannot see it and for search engines. Also the name screen readers hear for the viewer.', 'softicon-splat-viewer' ) }
			value={ alt }
			onChange={ ( value ) => set( { alt: value } ) }
			__nextHasNoMarginBottom
			__next40pxDefaultSize
		/>
	</Panel>;
};

export default PosterPanel;
