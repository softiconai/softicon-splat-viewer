import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { applyFilters } from '@wordpress/hooks';
import { HelpCards, Panel, PanelGroup } from '../../../vendor/softicon-tools/components/Panels';
import { helpCards } from '../../../utils/options';
import FilePanel from '../File/FilePanel';
import OrientationPanel from './OrientationPanel';
import CameraPanel from './CameraPanel';
import HotspotsPanel from './HotspotsPanel';
import PosterPanel from './PosterPanel';
import DisplayPanel from './DisplayPanel';
import LoadingPanel from './LoadingPanel';
import Shortcode from './Shortcode';

// the help cards, last in the sidebar
const Help = () => <Panel id="help" title={ __( 'Help', 'softicon-splat-viewer' ) }>
	<HelpCards cards={ helpCards } />
	<p className="alsvHelp">{ __( 'Email:', 'softicon-splat-viewer' ) } <a href="mailto:softiconai@gmail.com">softiconai@gmail.com</a></p>
	<Shortcode />
</Panel>;

// panel: a hotspot clicked in the preview opens the Hotspots panel (the group starts again, open there)
const Settings = ( props ) => {
	const { attributes, setAttributes, scan, panel } = props;
	return <InspectorControls>
		<div className="siSettings">
			<PanelGroup key={ panel } initial={ panel ? 'hotspots' : 'file' }>
				<FilePanel { ...props } />
				<OrientationPanel { ...props } />
				<CameraPanel { ...props } />
				<HotspotsPanel { ...props } />
				<PosterPanel { ...props } />
				<DisplayPanel { ...props } />
				<LoadingPanel { ...props } />

				{ /* Add-ons append their own panels. */ }
				{ applyFilters( 'alsv.block.inspector', null, { tab: 'general', attributes, setAttributes, scan } ) }
				<Help />
			</PanelGroup>
		</div>
	</InspectorControls>;
};

export default Settings;
