import { applyDefaults as baseApplyDefaults } from './gpml-utilities';

const LABEL_DEFAULTS = {
	attributes: {
		Align: {
			name: 'Align',
			value: 'Center'
		},
		Color: {
			name: 'Color',
			value: '000000'
		},
		FillColor: {
			name: 'FillColor',
			value: 'Transparent'
		},
		FontSize: {
			name:'FontSize',
			value:10
		},
		LineThickness: {
			name: 'LineThickness',
			value: 1
		},
		Padding: {
			name: 'Padding',
			value: '0.1em'
		},
		ShapeType: {
			name: 'ShapeType',
			value: 'None'
		},
		Valign: {
			name: 'Valign',
			value: 'Top'
		},
		ZOrder: {
			name: 'ZOrder',
			value: 0
		}
	}
};

export function applyDefaults(gpmlElement, defaults) {
	return baseApplyDefaults(gpmlElement, [LABEL_DEFAULTS, defaults]);
};
