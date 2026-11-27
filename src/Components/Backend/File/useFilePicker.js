import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { fileFromMedia } from '../../../utils/data';

// a file from the Media Library, an upload or a pasted address; anything but a splat file is refused
const useFilePicker = ( setAttributes ) => {
	const { createWarningNotice } = useDispatch( 'core/notices' );
	return ( media ) => {
		// an upload in progress comes first without an address, then again with it
		if ( media && 'string' !== typeof media && ! media.url ) {
			return;
		}
		const file = fileFromMedia( media );
		if ( file ) {
			setAttributes( { file } );
			return;
		}
		createWarningNotice( __( 'This is not a 3D scan file. Use a Gaussian splat file: .spz, .ply, .splat, .ksplat or .sog.', 'softicon-splat-viewer' ), { type: 'snackbar' } );
	};
};

export default useFilePicker;
