import { __ } from '@wordpress/i18n';
import { icons as shared } from '../vendor/softicon-tools/components/icons';

// the cards in the Help panel
export const helpCards = [
	{ href: 'https://wordpress.org/support/plugin/softicon-splat-viewer/', label: __( 'Get support', 'softicon-splat-viewer' ), icon: shared.support },
	{ href: 'https://wordpress.org/support/plugin/softicon-splat-viewer/reviews/#new-post', label: __( 'Rate Splat Viewer', 'softicon-splat-viewer' ), icon: shared.star },
	{ href: 'https://wordpress.org/plugins/author/softiconai/', label: __( 'More plugins', 'softicon-splat-viewer' ), icon: shared.plugins },
];

// what the file input offers
export const accept = '.spz,.ply,.splat,.ksplat,.sog';
