import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';
import { Panel, Tiles } from '../../../vendor/softicon-tools/components/Panels';
import { icons } from '../../../utils/icons';

// when the scan loads, and how sharp it draws
const LoadingPanel = ( { setAttributes, scan } ) => <Panel id="loading" title={ __( 'Loading', 'softicon-splat-viewer' ) }>
	<Tiles
		label={ __( 'Load the scan', 'softicon-splat-viewer' ) }
		tip={ __( 'On click, the page shows the poster with a "View in 3D" button, and nothing of the scan loads before a visitor presses it. Good for big files and long pages. The preview here always loads.', 'softicon-splat-viewer' ) }
		value={ scan.loadMode }
		options={ [
			{ value: 'visible', label: __( 'When in view', 'softicon-splat-viewer' ), icon: icons.eye },
			{ value: 'click', label: __( 'On click', 'softicon-splat-viewer' ), icon: icons.click },
		] }
		onChange={ ( loadMode ) => setAttributes( { loadMode } ) }
	/>
	<SelectControl
		label={ __( 'Quality', 'softicon-splat-viewer' ) }
		help={ __( 'Auto draws a little softer on phones, so the scan turns smoothly. Low is quickest everywhere.', 'softicon-splat-viewer' ) }
		value={ scan.look.quality }
		options={ [
			{ value: 'auto', label: __( 'Auto', 'softicon-splat-viewer' ) },
			{ value: 'high', label: __( 'High', 'softicon-splat-viewer' ) },
			{ value: 'low', label: __( 'Low', 'softicon-splat-viewer' ) },
		] }
		onChange={ ( quality ) => setAttributes( { quality } ) }
		__nextHasNoMarginBottom
		__next40pxDefaultSize
	/>
</Panel>;

export default LoadingPanel;
