import { __, _n, sprintf } from '@wordpress/i18n';
import { Button, TextControl, TextareaControl } from '@wordpress/components';
import { MediaUpload, MediaUploadCheck, URLInput } from '@wordpress/block-editor';
import { FieldHead, Panel, Tiles } from '../../../vendor/softicon-tools/components/Panels';
import { idOf, maxHotspots } from '../../../utils/data';
import { icons } from '../../../utils/icons';

// the image a card shows, not the full size
const imageOf = ( media ) => media?.sizes?.medium_large?.url || media?.sizes?.medium?.url || media?.url || '';

// a field as the author typed it (the cleaned copy would eat a space typed at the end)
const typed = ( value ) => ( 'string' === typeof value ? value : '' );

// the stored hotspot the preview's (cleaned) one came from, matched by id as cleanHotspot() makes it
const isSpot = ( spot ) => ( item, index ) => ( idOf( item?.id ) || 'h' + index ) === spot.id;

// One hotspot's fields. An info hotspot shows a card (title, text, image), a link hotspot opens its address.
// spot: as the preview shows it; raw: as stored, for the text fields.
const Spot = ( { spot, raw, index, open, onToggle, onChange, onRemove } ) => {
	const isLink = 'link' === spot.type;
	const untitled = isLink ? spot.url : '';
	return <div className={ 'alsvSpot' + ( open ? ' is-open' : '' ) }>
		<button type="button" className="alsvSpotHead" aria-expanded={ open } onClick={ onToggle }>
			<span className="alsvSpotNumber">{ index + 1 }</span>
			<span className="alsvSpotTitle">{ spot.title || untitled || __( 'Untitled', 'softicon-splat-viewer' ) }</span>
			{ spot.draft && <span className="alsvSpotDraft">{ __( 'Not shown yet', 'softicon-splat-viewer' ) }</span> }
		</button>
		{ open && <div className="alsvSpotBody">
			<Tiles
				label={ __( 'Type', 'softicon-splat-viewer' ) }
				value={ spot.type }
				options={ [
					{ value: 'info', label: __( 'Info card', 'softicon-splat-viewer' ), icon: icons.info },
					{ value: 'link', label: __( 'Link', 'softicon-splat-viewer' ), icon: icons.link },
				] }
				onChange={ ( type ) => onChange( { type } ) }
			/>
			<TextControl
				label={ isLink ? __( 'Label', 'softicon-splat-viewer' ) : __( 'Title', 'softicon-splat-viewer' ) }
				help={ isLink ? __( 'Shown beside the hotspot when the mouse is over it.', 'softicon-splat-viewer' ) : '' }
				value={ typed( raw.title ) }
				onChange={ ( title ) => onChange( { title } ) }
				__nextHasNoMarginBottom
				__next40pxDefaultSize
			/>
			{ isLink && <URLInput
				label={ __( 'Link address', 'softicon-splat-viewer' ) }
				value={ typed( raw.url ) }
				onChange={ ( url ) => onChange( { url } ) }
				placeholder="https://"
				__nextHasNoMarginBottom
			/> }
			{ ! isLink && <>
				<TextareaControl
					label={ __( 'Text', 'softicon-splat-viewer' ) }
					value={ typed( raw.text ) }
					onChange={ ( text ) => onChange( { text } ) }
					rows={ 4 }
					__nextHasNoMarginBottom
				/>
				<div>
					<FieldHead label={ __( 'Image', 'softicon-splat-viewer' ) } />
					{ spot.imageUrl && <img className="alsvSpotImage" src={ spot.imageUrl } alt="" /> }
					<MediaUploadCheck>
						<div className="alsvButtons">
							<MediaUpload
								allowedTypes={ [ 'image' ] }
								value={ spot.imageId || undefined }
								onSelect={ ( media ) => onChange( { imageId: media.id, imageUrl: imageOf( media ) } ) }
								render={ ( { open: choose } ) => <Button variant="secondary" onClick={ choose }>
									{ spot.imageUrl ? __( 'Replace', 'softicon-splat-viewer' ) : __( 'Choose an image', 'softicon-splat-viewer' ) }
								</Button> }
							/>
							{ spot.imageUrl && <Button variant="tertiary" onClick={ () => onChange( { imageId: 0, imageUrl: '' } ) }>{ __( 'Remove', 'softicon-splat-viewer' ) }</Button> }
						</div>
					</MediaUploadCheck>
				</div>
			</> }
			{ spot.draft && <p className="alsvHelp alsvWarn">
				{ isLink
					? __( 'Add the link address. Until then this hotspot is not shown on the page.', 'softicon-splat-viewer' )
					: __( 'Add a title, text or image. Until then this hotspot is not shown on the page.', 'softicon-splat-viewer' ) }
			</p> }
			<p className="alsvHelp">{ __( 'To move it, drag the hotspot in the preview.', 'softicon-splat-viewer' ) }</p>
			<div className="alsvButtons">
				<Button variant="tertiary" isDestructive icon={ icons.remove } onClick={ onRemove }>{ __( 'Remove hotspot', 'softicon-splat-viewer' ) }</Button>
			</div>
		</div> }
	</div>;
};

// points on the scan that open a card or a link; placed by clicking the scan in the preview
const HotspotsPanel = ( { attributes, setAttributes, scan, placing, setPlacing, selected, setSelected } ) => {
	const spots = scan.hotspots;
	const stored = Array.isArray( attributes.hotspots ) ? attributes.hotspots : [];
	const full = spots.length >= maxHotspots;
	const change = ( spot, values ) => setAttributes( { hotspots: stored.map( ( item, index ) => ( isSpot( spot )( item, index ) ? { ...item, ...values } : item ) ) } );
	const remove = ( spot ) => setAttributes( { hotspots: stored.filter( ( item, index ) => ! isSpot( spot )( item, index ) ) } );

	return <Panel id="hotspots" title={ __( 'Hotspots', 'softicon-splat-viewer' ) } badge={ spots.length ? String( spots.length ) : null }>
		<div>
			<FieldHead
				label={ __( 'Add', 'softicon-splat-viewer' ) }
				tip={ __( 'Press "Add a hotspot", then click on the scan in the preview where it goes. With the keyboard: Enter on the preview places it in the middle of the view, Esc stops.', 'softicon-splat-viewer' ) }
			/>
			<div className="alsvButtons">
				<Button variant={ placing ? 'secondary' : 'primary' } icon={ placing ? null : icons.add } disabled={ full && ! placing } onClick={ () => setPlacing( ! placing ) }>
					{ placing ? __( 'Stop adding', 'softicon-splat-viewer' ) : __( 'Add a hotspot', 'softicon-splat-viewer' ) }
				</Button>
			</div>
			<p className="alsvHelp">
				{ placing && __( 'Click on the scan in the preview where the hotspot goes.', 'softicon-splat-viewer' ) }
				{ ! placing && full && sprintf(
					/* translators: %d: the most hotspots one scan can have */
					_n( 'A scan can have %d hotspot.', 'A scan can have %d hotspots.', maxHotspots, 'softicon-splat-viewer' ),
					maxHotspots
				) }
			</p>
		</div>
		{ !! spots.length && <div className="alsvSpots">
			{ spots.map( ( spot, index ) => <Spot
				key={ spot.id }
				spot={ spot }
				raw={ stored.find( isSpot( spot ) ) || {} }
				index={ index }
				open={ selected === spot.id }
				onToggle={ () => setSelected( selected === spot.id ? null : spot.id ) }
				onChange={ ( values ) => change( spot, values ) }
				onRemove={ () => remove( spot ) }
			/> ) }
		</div> }
	</Panel>;
};

export default HotspotsPanel;
