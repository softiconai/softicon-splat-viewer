import { __ } from '@wordpress/i18n';
// eslint-disable-next-line @wordpress/no-unsafe-wp-apis -- the same height control as SoftIcon Virtual Tour's
import { RangeControl, __experimentalUnitControl as UnitControl } from '@wordpress/components';
import { ColorRow, FieldHead, Panel, Reset, Tiles, ToggleRow } from '../../../vendor/softicon-tools/components/Panels';
import { useDispatch } from '@wordpress/data';
import { icons } from '../../../utils/icons';
import { colorOf, heightOf } from '../../../utils/data';

const units = [ { value: 'px', label: 'px', default: 480 }, { value: 'vh', label: 'vh', default: 70 } ];

// a number and a unit, or nothing (a unit picked in an empty field is not a height)
const valueOf = ( value ) => ( /\d/.test( value || '' ) ? value : '' );

const Height = ( { label, tip, value, onChange } ) => <div>
	<FieldHead label={ label } tip={ tip } action={ <Reset onClick={ () => onChange( '' ) } disabled={ ! value } /> } />
	<UnitControl label={ label } hideLabelFromVision value={ value } placeholder="480" units={ units } min={ 1 } max={ 3000 } isResetValueOnUnitChange onChange={ ( next ) => onChange( valueOf( next ) ) } __next40pxDefaultSize />
	{ /* a height the block drops (Block::height()): say so, as the viewer keeps its default */ }
	{ value && ! heightOf( value ) && <p className="alsvHelp alsvWarn">{ __( 'Use 100 to 3000 px, or 10 to 100 vh. Until then the default height is used.', 'softicon-splat-viewer' ) }</p> }
</div>;

// how the viewer looks on the page, and which buttons visitors get
const DisplayPanel = ( { attributes, setAttributes, scan } ) => {
	const look = scan.look;
	const set = ( key ) => ( value ) => setAttributes( { [ key ]: value } );
	const own = '#' === look.background[ 0 ];
	const { createWarningNotice } = useDispatch( 'core/notices' );
	// a theme's palette may hold colors such as color-mix(…) that the block cannot keep: only #hex
	const color = ( key, empty ) => ( value ) => {
		if ( value && ! colorOf( value ) ) {
			createWarningNotice( __( 'This color cannot be used here. Pick another one, or type a #hex color.', 'softicon-splat-viewer' ), { type: 'snackbar' } );
			return;
		}
		setAttributes( { [ key ]: value || empty } );
	};
	// as stored, so the palette marks the swatch picked (the clean copy is in small letters)
	const stored = ( key ) => ( colorOf( attributes[ key ] ) ? attributes[ key ] : '' );

	return <Panel id="display" title={ __( 'Display', 'softicon-splat-viewer' ) }>
		<Height
			label={ __( 'Height', 'softicon-splat-viewer' ) }
			tip={ __( '100 to 3000 px, or 10 to 100 vh (a share of the screen height: 100vh fills the screen). Empty: 480 px.', 'softicon-splat-viewer' ) }
			value={ typeof attributes.height === 'string' ? attributes.height : '' }
			onChange={ set( 'height' ) }
		/>
		<Height
			label={ __( 'Height on phones', 'softicon-splat-viewer' ) }
			tip={ __( 'For screens up to 600px wide. Empty: the same as above.', 'softicon-splat-viewer' ) }
			value={ typeof attributes.mobileHeight === 'string' ? attributes.mobileHeight : '' }
			onChange={ set( 'mobileHeight' ) }
		/>
		<RangeControl
			label={ __( 'Rounded corners (px)', 'softicon-splat-viewer' ) }
			value={ look.radius }
			min={ 0 }
			max={ 100 }
			onChange={ ( value ) => setAttributes( { radius: Number( value ) >= 0 ? Number( value ) : 12 } ) }
			__nextHasNoMarginBottom
			__next40pxDefaultSize
		/>
		<Tiles
			label={ __( 'Background', 'softicon-splat-viewer' ) }
			tip={ __( 'Behind the scan. None lets the page show through. The poster you capture gets the same background.', 'softicon-splat-viewer' ) }
			value={ own ? '' : look.background }
			options={ [
				{ value: 'dark', label: __( 'Dark', 'softicon-splat-viewer' ), icon: icons.dark },
				{ value: 'light', label: __( 'Light', 'softicon-splat-viewer' ), icon: icons.light },
				{ value: 'transparent', label: __( 'None', 'softicon-splat-viewer' ), icon: icons.none },
			] }
			onChange={ set( 'background' ) }
		/>
		{ /* ColorRow says "… color" to screen readers itself */ }
		<FieldHead label={ __( 'Colors', 'softicon-splat-viewer' ) } />
		<ColorRow label={ __( 'Own background', 'softicon-splat-viewer' ) } value={ own ? stored( 'background' ) : '' } onChange={ color( 'background', 'dark' ) } />
		<ColorRow label={ __( 'Hotspot', 'softicon-splat-viewer' ) } value={ stored( 'hotspotColor' ) } onChange={ color( 'hotspotColor', '' ) } />

		<FieldHead label={ __( 'Buttons for visitors', 'softicon-splat-viewer' ) } tip={ __( 'In the corner of the viewer, once the scan has loaded.', 'softicon-splat-viewer' ) } />
		<ToggleRow label={ __( 'Back to the start view', 'softicon-splat-viewer' ) } checked={ scan.toolbar.reset } onChange={ set( 'showReset' ) } />
		<ToggleRow label={ __( 'Full screen', 'softicon-splat-viewer' ) } checked={ scan.toolbar.fullscreen } onChange={ set( 'showFullscreen' ) } />
		<ToggleRow label={ __( 'Show or hide the hotspots', 'softicon-splat-viewer' ) } tip={ __( 'Only when the scan has hotspots.', 'softicon-splat-viewer' ) } checked={ scan.toolbar.hotspots } onChange={ set( 'showHotspotToggle' ) } />
		<ToggleRow label={ __( 'Turn on its own', 'softicon-splat-viewer' ) } tip={ __( 'Visitors start or stop the turning (Orbit only).', 'softicon-splat-viewer' ) } checked={ scan.toolbar.autoRotate } onChange={ set( 'showAutoRotate' ) } />
		<ToggleRow label={ __( 'Walk inside', 'softicon-splat-viewer' ) } tip={ __( 'Visitors switch between going around the scan and walking inside it.', 'softicon-splat-viewer' ) } checked={ scan.toolbar.mode } onChange={ set( 'showModeSwitch' ) } />
	</Panel>;
};

export default DisplayPanel;
