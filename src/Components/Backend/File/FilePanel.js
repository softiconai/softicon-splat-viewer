import { __, sprintf } from '@wordpress/i18n';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { Button, Notice } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { Panel } from '../../../vendor/softicon-tools/components/Panels';
import { icons } from '../../../utils/icons';
import useFilePicker from './useFilePicker';

// the scan file: its name and format, replace or remove it
const FilePanel = ( { setAttributes, scan } ) => {
	const pick = useFilePicker( setAttributes );
	const name = scan.file.url.split( /[?#]/ )[ 0 ].split( '/' ).pop();
	// the size WordPress noted at upload; files from an address have none
	const bytes = useSelect( ( select ) => ( scan.file.id ? select( 'core' ).getMedia( scan.file.id, { context: 'view' } )?.media_details?.filesize : 0 ), [ scan.file.id ] ) || 0;
	const mb = bytes / 1048576;
	const megabytes = () => sprintf(
		// translators: %s: a file size in megabytes, like 3.8
		__( '%s MB', 'softicon-splat-viewer' ),
		mb.toFixed( 1 )
	);
	const kilobytes = () => sprintf(
		// translators: %d: a file size in kilobytes
		__( '%d KB', 'softicon-splat-viewer' ),
		Math.max( 1, Math.round( bytes / 1024 ) )
	);
	const size = mb >= 1 ? megabytes() : kilobytes();

	return <Panel id="file" title={ __( '3D scan', 'softicon-splat-viewer' ) }>
		<div className="alsvFile">
			<span className="alsvFormat">{ scan.file.format }</span>
			<span className="alsvFileName" title={ scan.file.url }>{ name }</span>
			{ bytes > 0 && <span className="alsvFileSize">{ size }</span> }
		</div>
		{ mb > 20 && <Notice
			status="warning"
			isDismissible={ false }
			// big files load only when a visitor asks (Loading panel)
			actions={ 'click' === scan.loadMode ? [] : [ { label: __( 'Load on click', 'softicon-splat-viewer' ), onClick: () => setAttributes( { loadMode: 'click' } ), variant: 'secondary' } ] }
		>
			{
				// translators: %s: the file size in MB
				sprintf( __( 'This file is %s MB, so it may load slowly on phones. A .spz file is usually about ten times smaller than a .ply file: most scan apps can export one. Or load it only when a visitor presses "View in 3D".', 'softicon-splat-viewer' ), Math.round( mb ) )
			}
		</Notice> }
		<div className="alsvButtons">
			<MediaUploadCheck>
				<MediaUpload
					value={ scan.file.id || undefined }
					onSelect={ pick }
					render={ ( { open } ) => <Button variant="secondary" icon={ icons.upload } onClick={ open }>
						{ __( 'Replace', 'softicon-splat-viewer' ) }
					</Button> }
				/>
			</MediaUploadCheck>
			<Button variant="tertiary" isDestructive icon={ icons.remove } onClick={ () => setAttributes( { file: {} } ) }>
				{ __( 'Remove', 'softicon-splat-viewer' ) }
			</Button>
		</div>
		<p className="alsvHelp">{ __( 'Gaussian splat files: .spz, .ply, .splat, .ksplat or .sog. A .spz file is the smallest and loads fastest.', 'softicon-splat-viewer' ) }</p>
	</Panel>;
};

export default FilePanel;
