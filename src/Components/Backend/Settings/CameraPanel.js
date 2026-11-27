import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { Button, RangeControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { FieldHead, Panel, Tiles, ToggleRow } from '../../../vendor/softicon-tools/components/Panels';
import { icons } from '../../../utils/icons';

// how visitors move: around the scan or inside it, where they start, and what moves on its own
const CameraPanel = ( { setAttributes, scan, ask } ) => {
	const camera = scan.camera;
	const { createWarningNotice } = useDispatch( 'core/notices' );
	const [ busy, setBusy ] = useState( false );
	const set = ( change ) => setAttributes( { camera: { ...camera, ...change } } );
	const saved = !! ( camera.position && camera.target );

	const useCurrent = async () => {
		setBusy( true );
		const answer = await ask( 'view' );
		setBusy( false );
		if ( answer?.position && answer?.target ) {
			set( { position: answer.position, target: answer.target } );
		} else {
			createWarningNotice( __( 'Wait until the scan has loaded in the preview, then try again.', 'softicon-splat-viewer' ), { type: 'snackbar' } );
		}
	};

	return <Panel id="camera" title={ __( 'Camera', 'softicon-splat-viewer' ) }>
		<Tiles
			label={ __( 'Mode', 'softicon-splat-viewer' ) }
			tip={ __( 'Orbit turns around the scan, for objects. Walk moves inside it, for rooms: drag to look around, W A S D or the arrow keys to walk, two fingers on a phone.', 'softicon-splat-viewer' ) }
			value={ camera.mode }
			options={ [
				{ value: 'orbit', label: __( 'Orbit', 'softicon-splat-viewer' ), icon: icons.orbit },
				{ value: 'walk', label: __( 'Walk', 'softicon-splat-viewer' ), icon: icons.walk },
			] }
			// turning on its own is for Orbit: Walk turns it off, so it never starts hidden when visitors switch
			onChange={ ( mode ) => set( { mode, position: null, target: null, ...( 'walk' === mode ? { autoRotate: false } : {} ) } ) }
		/>
		<div>
			<FieldHead label={ __( 'Start view', 'softicon-splat-viewer' ) } tip={ __( 'Turn and zoom the scan in the preview until it looks right, then press "Use the current view". Visitors start from there.', 'softicon-splat-viewer' ) } />
			<div className="alsvButtons">
				<Button variant="secondary" icon={ icons.camera } isBusy={ busy } disabled={ busy } onClick={ useCurrent }>{ __( 'Use the current view', 'softicon-splat-viewer' ) }</Button>
				{ saved && <Button variant="tertiary" onClick={ () => set( { position: null, target: null } ) }>{ __( 'Automatic', 'softicon-splat-viewer' ) }</Button> }
			</div>
			<p className="alsvHelp">{ saved ? __( 'Visitors start from the view you saved.', 'softicon-splat-viewer' ) : __( 'Automatic: the whole scan fills the view.', 'softicon-splat-viewer' ) }</p>
		</div>
		<RangeControl
			label={ __( 'Field of view', 'softicon-splat-viewer' ) }
			help={ __( 'Degrees. Wider shows more of a room, narrower looks closer.', 'softicon-splat-viewer' ) }
			value={ camera.fov }
			min={ 20 }
			max={ 120 }
			step={ 1 }
			onChange={ ( value ) => set( { fov: Number( value ) || 50 } ) }
			__nextHasNoMarginBottom
			__next40pxDefaultSize
		/>
		{ 'orbit' === camera.mode && <>
			<ToggleRow
				label={ __( 'Turn on its own', 'softicon-splat-viewer' ) }
				tip={ __( 'The scan turns slowly until the visitor touches it. Off for visitors who ask their device for less motion.', 'softicon-splat-viewer' ) }
				checked={ camera.autoRotate }
				onChange={ ( autoRotate ) => set( { autoRotate } ) }
			/>
			{ /* also the speed of the visitors' "Turn on its own" button (Display panel) */ }
			{ ( camera.autoRotate || scan.toolbar.autoRotate ) && <RangeControl
				label={ __( 'Turning speed', 'softicon-splat-viewer' ) }
				value={ camera.speed }
				min={ 0.1 }
				max={ 10 }
				step={ 0.1 }
				onChange={ ( value ) => set( { speed: Number( value ) || 1 } ) }
				__nextHasNoMarginBottom
				__next40pxDefaultSize
			/> }
		</> }
		<ToggleRow
			label={ __( 'Zoom with the wheel and pinch', 'softicon-splat-viewer' ) }
			tip={ __( 'Turn off when the scan sits in a long page, so the mouse wheel scrolls the page instead. In Walk mode the wheel moves forward and back.', 'softicon-splat-viewer' ) }
			checked={ camera.zoom }
			onChange={ ( zoom ) => set( { zoom } ) }
		/>
	</Panel>;
};

export default CameraPanel;
