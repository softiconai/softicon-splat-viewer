import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { Button, RangeControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { FieldHead, Panel, Reset } from '../../../vendor/softicon-tools/components/Panels';

// any angle as -180..180
const wrap = ( degrees ) => ( ( ( ( Math.round( degrees ) + 180 ) % 360 ) + 360 ) % 360 ) - 180;

const AXES = [ 'rotX', 'rotY', 'rotZ' ];

// scans often arrive upside down or on their side: turn, size and center them
const OrientationPanel = ( { setAttributes, scan, ask } ) => {
	const transform = scan.transform;
	const { createWarningNotice } = useDispatch( 'core/notices' );
	const [ busy, setBusy ] = useState( false );
	const set = ( change ) => setAttributes( { transform: { ...transform, ...change } } );
	const turned = AXES.some( ( axis ) => transform[ axis ] ) || 1 !== transform.scale || transform.offset.some( Boolean );

	const center = async () => {
		setBusy( true );
		const answer = await ask( 'center' );
		setBusy( false );
		if ( answer?.offset ) {
			set( { offset: answer.offset } );
		} else {
			createWarningNotice( __( 'Wait until the scan has loaded in the preview, then try again.', 'softicon-splat-viewer' ), { type: 'snackbar' } );
		}
	};

	return <Panel id="orientation" title={ __( 'Orientation', 'softicon-splat-viewer' ) }>
		<FieldHead
			label={ __( 'Turn', 'softicon-splat-viewer' ) }
			tip={ __( 'Many scans arrive upside down or on their side. Flip or turn the scan until it stands upright in the preview.', 'softicon-splat-viewer' ) }
			action={ <Reset disabled={ ! turned } onClick={ () => setAttributes( { transform: {} } ) } /> }
		/>
		<div className="alsvButtons">
			<Button variant="secondary" onClick={ () => set( { rotX: wrap( transform.rotX + 180 ) } ) }>
				{ __( 'Flip upside down', 'softicon-splat-viewer' ) }
			</Button>
			{ AXES.map( ( axis ) => <Button key={ axis } variant="secondary" onClick={ () => set( { [ axis ]: wrap( transform[ axis ] + 90 ) } ) }>
				{
					// translators: %s: an axis, X, Y or Z
					sprintf( __( '%s +90°', 'softicon-splat-viewer' ), axis.slice( -1 ) )
				}
			</Button> ) }
		</div>
		{ AXES.map( ( axis ) => <RangeControl
			key={ axis }
			label={ sprintf(
				// translators: %s: an axis, X, Y or Z
				__( 'Turn around %s', 'softicon-splat-viewer' ),
				axis.slice( -1 )
			) }
			value={ transform[ axis ] }
			min={ -180 }
			max={ 180 }
			step={ 1 }
			onChange={ ( value ) => set( { [ axis ]: wrap( Number( value ) || 0 ) } ) }
			__nextHasNoMarginBottom
			__next40pxDefaultSize
		/> ) }
		<RangeControl
			label={ __( 'Size', 'softicon-splat-viewer' ) }
			help={ __( 'Makes the scan bigger or smaller compared with the camera. Mostly useful for Walk mode.', 'softicon-splat-viewer' ) }
			value={ transform.scale }
			min={ 0.1 }
			max={ 10 }
			step={ 0.1 }
			onChange={ ( value ) => set( { scale: Number( value ) || 1 } ) }
			__nextHasNoMarginBottom
			__next40pxDefaultSize
		/>
		<div>
			<Button variant="secondary" isBusy={ busy } disabled={ busy } onClick={ center }>{ __( 'Center the scan', 'softicon-splat-viewer' ) }</Button>
			<p className="alsvHelp">{ __( 'Moves the middle of the scan to the middle of the view, so it turns around itself.', 'softicon-splat-viewer' ) }</p>
		</div>
	</Panel>;
};

export default OrientationPanel;
