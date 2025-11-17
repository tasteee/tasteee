import Image from '@tiptap/extension-image';
import { mergeAttributes, nodeInputRule } from '@tiptap/core';

export interface ResizableImageOptions {
	inline: boolean;
	allowBase64: boolean;
	HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		resizableImage: {
			setImage: (options: {
				src: string;
				alt?: string;
				title?: string;
				width?: string | number;
			}) => ReturnType;
			setImageGrid: (images: Array<{ src: string; alt?: string }>, columns?: number) => ReturnType;
		};
	}
}

export const ResizableImage = Image.extend<ResizableImageOptions>({
	name: 'image',

	addAttributes() {
		return {
			...this.parent?.(),
			width: {
				default: null,
				parseHTML: (element) => element.getAttribute('data-width') || element.style.width,
				renderHTML: (attributes) => {
					if (!attributes.width) {
						return {};
					}
					return {
						'data-width': attributes.width,
						style: `width: ${attributes.width}${typeof attributes.width === 'number' ? 'px' : ''}`
					};
				}
			},
			height: {
				default: null,
				parseHTML: (element) => element.getAttribute('data-height') || element.style.height,
				renderHTML: (attributes) => {
					if (!attributes.height) {
						return {};
					}
					return {
						'data-height': attributes.height,
						style: `height: ${attributes.height}${typeof attributes.height === 'number' ? 'px' : ''}`
					};
				}
			},
			gridColumns: {
				default: null,
				parseHTML: (element) => element.getAttribute('data-grid-columns'),
				renderHTML: (attributes) => {
					if (!attributes.gridColumns) {
						return {};
					}
					return {
						'data-grid-columns': attributes.gridColumns
					};
				}
			}
		};
	},

	parseHTML() {
		return [
			{
				tag: 'img[src]'
			}
		];
	},

	renderHTML({ HTMLAttributes }) {
		return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
	},

	addCommands() {
		return {
			setImage:
				(options) =>
				({ commands }) => {
					return commands.insertContent({
						type: this.name,
						attrs: options
					});
				},
			setImageGrid:
				(images, columns = 2) =>
				({ commands, chain }) => {
					// Create a wrapper div for the grid
					const gridHtml = `
						<div class="image-grid" data-grid-columns="${columns}">
							${images.map((img) => `<img src="${img.src}" alt="${img.alt || ''}" />`).join('')}
						</div>
					`;
					return commands.insertContent(gridHtml);
				}
		};
	},

	addInputRules() {
		return [
			nodeInputRule({
				find: /!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/,
				type: this.type,
				getAttributes: (match) => {
					const [, alt, src, title] = match;
					return { src, alt, title };
				}
			})
		];
	}
});

export default ResizableImage;
