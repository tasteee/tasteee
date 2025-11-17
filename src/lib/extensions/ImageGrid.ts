import { Node, mergeAttributes } from '@tiptap/core';

export interface ImageGridOptions {
	HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		imageGrid: {
			setImageGrid: (images: Array<{ src: string; alt?: string }>, columns?: number) => ReturnType;
		};
	}
}

export const ImageGrid = Node.create<ImageGridOptions>({
	name: 'imageGrid',

	group: 'block',

	content: 'image+',

	addAttributes() {
		return {
			columns: {
				default: 2,
				parseHTML: (element) => {
					return parseInt(element.getAttribute('data-grid-columns') || '2');
				},
				renderHTML: (attributes) => {
					return {
						'data-grid-columns': attributes.columns
					};
				}
			}
		};
	},

	parseHTML() {
		return [
			{
				tag: 'div.image-grid'
			}
		];
	},

	renderHTML({ HTMLAttributes }) {
		return [
			'div',
			mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
				class: 'image-grid'
			}),
			0
		];
	},

	addCommands() {
		return {
			setImageGrid:
				(images, columns = 2) =>
				({ commands, state, dispatch }) => {
					// Create image nodes
					const imageNodes = images.map((img) => ({
						type: 'image',
						attrs: {
							src: img.src,
							alt: img.alt || '',
							class: 'grid-image'
						}
					}));

					// Create grid container with images
					const gridNode = {
						type: this.name,
						attrs: {
							columns
						},
						content: imageNodes
					};

					return commands.insertContent(gridNode);
				}
		};
	}
});

export default ImageGrid;
