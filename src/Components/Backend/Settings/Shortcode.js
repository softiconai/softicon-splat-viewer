import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { FieldHead } from '../../../vendor/softicon-tools/components/Panels';

// a scan under 3D Scans → All Scans (includes/class-shortcode.php): its shortcode, for the Classic Editor,
// WooCommerce product descriptions and page builders
const Shortcode = () => {
	const [ copied, setCopied ] = useState( false );
	const { type, id, published } = useSelect( ( select ) => {
		const editor = select( 'core/editor' );
		return { type: editor?.getCurrentPostType(), id: editor?.getCurrentPostId(), published: 'publish' === editor?.getEditedPostAttribute( 'status' ) };
	}, [] );
	if ( 'alsv_scan' !== type || ! id ) {
		return null;
	}
	const code = `[softicon_splat id="${ id }"]`;
	const copy = ( event ) => {
		const input = event.currentTarget.previousElementSibling;
		const done = () => {
			setCopied( true );
			setTimeout( () => setCopied( false ), 1600 );
		};
		if ( window.navigator.clipboard && window.isSecureContext ) {
			window.navigator.clipboard.writeText( code ).then( done );
			return;
		}
		// http sites have no clipboard API
		input.select();
		if ( input.ownerDocument.execCommand( 'copy' ) ) {
			done();
		}
	};
	return <div className="alsvShortcode">
		<FieldHead label={ __( 'Shortcode', 'softicon-splat-viewer' ) } tip={ __( 'Paste it in a WooCommerce product description, the Classic Editor, Elementor or any page builder to show this scan there.', 'softicon-splat-viewer' ) } />
		<div className="alsvShortcodeRow">
			<input type="text" readOnly value={ code } onFocus={ ( event ) => event.target.select() } aria-label={ __( 'Shortcode', 'softicon-splat-viewer' ) } />
			<Button variant="secondary" onClick={ copy }>{ copied ? __( 'Copied', 'softicon-splat-viewer' ) : __( 'Copy', 'softicon-splat-viewer' ) }</Button>
		</div>
		{ ! published && <p className="alsvHelp">{ __( 'It shows the scan once it is published.', 'softicon-splat-viewer' ) }</p> }
		{ /* includes/class-shortcode.php: any setting, by its name, for the one place the shortcode is pasted */ }
		<details className="alsvShortcodeMore">
			<summary>{ __( 'Change a setting in one place', 'softicon-splat-viewer' ) }</summary>
			<p>{ __( 'Add a setting to the shortcode to change it only where you paste it; this scan keeps its own everywhere else. For example:', 'softicon-splat-viewer' ) }</p>
			<code>{ `[softicon_splat id="${ id }" height="600" background="light" load="click"]` }</code>
			<p>{ __( 'More:', 'softicon-splat-viewer' ) } <code>mobile_height</code>, <code>radius</code>, <code>background</code> (dark, light, transparent, #hex), <code>hotspot_color</code>, <code>quality</code> (auto, high, low), <code>load</code> (visible, click), <code>show_reset</code>, <code>show_fullscreen</code>, <code>show_hotspot_toggle</code>, <code>show_auto_rotate</code>, <code>show_mode_switch</code>.</p>
			<p>{ __( 'Yes or no settings take yes, no, true, false, 1 or 0. A name or value the scan does not know is left out, with a note that only its editors see.', 'softicon-splat-viewer' ) }</p>
		</details>
	</div>;
};

export default Shortcode;
