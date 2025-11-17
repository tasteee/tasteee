<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Placeholder from '@tiptap/extension-placeholder';
	import Youtube from '@tiptap/extension-youtube';
	import ResizableImage from '$lib/extensions/ResizableImage';
	import ImageGrid from '$lib/extensions/ImageGrid';
	import { supabase } from '$lib/supabaseClient';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button';

	let editor: Editor;
	let element: HTMLElement;
	let title = '';
	let saving = false;
	let uploadingImage = false;
	let showImageInput = false;
	let imageUrl = '';
	let postId: string | null = null;
	let isEditMode = false;
	let publishedAt: string | null = null;
	let selectedImage: HTMLImageElement | null = null;
	let imageWidth = '';
	let showGridModal = false;
	let gridImages: Array<{ src: string; file?: File }> = [];
	let gridColumns = 2;

	onMount(async () => {
		editor = new Editor({
			element: element,
			extensions: [
				StarterKit.configure({
					heading: {
						levels: [1, 2, 3]
					}
				}),
				ResizableImage.configure({
					HTMLAttributes: {
						class: 'editor-image'
					},
					inline: false,
					allowBase64: false
				}),
				ImageGrid.configure({
					HTMLAttributes: {}
				}),
				Youtube.configure({
					width: 640,
					height: 360,
					HTMLAttributes: {
						class: 'my-4 rounded-lg'
					}
				}),
				Placeholder.configure({
					placeholder: 'Tell your story...'
				})
			],
			editorProps: {
				attributes: {
					class: 'prose prose-lg max-w-none focus:outline-none h-full px-4'
				},
				handleClick(view, pos, event) {
					const target = event.target as HTMLElement;
					if (target.tagName === 'IMG') {
						handleImageClick(target as HTMLImageElement);
						return true;
					}
					return false;
				}
			}
		});

		// Check if we're editing an existing post
		const editId = $page.url.searchParams.get('id');
		if (editId) {
			await loadPost(editId);
		}
	});

	async function loadPost(id: string) {
		try {
			const { data: post, error } = await supabase.from('posts').select('*').eq('id', id).single();

			if (error) throw error;

			if (post) {
				postId = post.id;
				isEditMode = true;
				publishedAt = post.published_at;
				title = post.title;
				if (editor && post.content) {
					editor.commands.setContent(post.content);
				}
			}
		} catch (error: any) {
			alert('Error loading post: ' + error.message);
		}
	}

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});

	async function handleImageUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files || !input.files[0]) return;

		const file = input.files[0];
		uploadingImage = true;

		try {
			const fileExt = file.name.split('.').pop();
			const fileName = `${Math.random()}.${fileExt}`;
			const filePath = `${fileName}`;

			const { error: uploadError, data } = await supabase.storage
				.from('blog-media')
				.upload(filePath, file);

			if (uploadError) throw uploadError;

			const { data: urlData } = supabase.storage.from('blog-media').getPublicUrl(filePath);

			if (editor && urlData.publicUrl) {
				editor.chain().focus().setImage({ src: urlData.publicUrl }).run();
			}
		} catch (error: any) {
			alert('Error uploading image: ' + error.message);
		} finally {
			uploadingImage = false;
			input.value = '';
		}
	}

	function addImageByUrl() {
		if (imageUrl && editor) {
			editor.chain().focus().setImage({ src: imageUrl }).run();
			imageUrl = '';
			showImageInput = false;
		}
	}

	function addYoutubeVideo() {
		const url = prompt('Enter YouTube URL:');
		if (url && editor) {
			editor.commands.setYoutubeVideo({ src: url });
		}
	}

	async function publishPost() {
		if (!title.trim()) {
			alert('Please add a title');
			return;
		}

		if (!editor) return;

		saving = true;
		const content = editor.getJSON();
		const excerpt = editor.getText().substring(0, 160);
		const slug = title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');

		try {
			const { data: userData } = await supabase.auth.getUser();

			if (!userData.user) {
				throw new Error('Not authenticated');
			}

			if (postId) {
				// Update existing post
				const now = new Date().toISOString();
				const updateData: any = {
					title,
					content,
					excerpt,
					published: true,
					updated_at: now
				};

				// Check if this is the first time publishing (was a draft)
				const { data: existingPost } = await supabase
					.from('posts')
					.select('published_at')
					.eq('id', postId)
					.single();

				// If no published_at exists, this is the first publish
				if (existingPost && !existingPost.published_at) {
					updateData.published_at = now;
				}

				const { error } = await supabase.from('posts').update(updateData).eq('id', postId);

				if (error) throw error;
			} else {
				// Insert new post
				const now = new Date().toISOString();
				const { error } = await supabase.from('posts').insert({
					title,
					content,
					excerpt,
					author_id: userData.user.id,
					slug,
					published: true,
					published_at: now
				});

				if (error) throw error;
			}

			goto('/');
		} catch (error: any) {
			alert('Error publishing post: ' + error.message);
		} finally {
			saving = false;
		}
	}

	async function saveDraft() {
		if (!title.trim()) {
			alert('Please add a title');
			return;
		}

		if (!editor) return;

		saving = true;
		const content = editor.getJSON();
		const excerpt = editor.getText().substring(0, 160);
		const slug = title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');

		try {
			const { data: userData } = await supabase.auth.getUser();

			if (!userData.user) {
				throw new Error('Not authenticated');
			}

			if (postId) {
				// Update existing post as draft
				const { error } = await supabase
					.from('posts')
					.update({
						title,
						content,
						excerpt,
						published: false,
						updated_at: new Date().toISOString()
					})
					.eq('id', postId);

				if (error) throw error;
			} else {
				// Insert new draft
				const { error } = await supabase.from('posts').insert({
					title,
					content,
					excerpt,
					author_id: userData.user.id,
					slug,
					published: false
				});

				if (error) throw error;
			}

			alert('Draft saved!');
		} catch (error: any) {
			alert('Error saving draft: ' + error.message);
		} finally {
			saving = false;
		}
	}

	function setHeading(level: 1 | 2 | 3) {
		editor?.chain().focus().toggleHeading({ level }).run();
	}

	const toggleBold = () => {
		editor?.chain().focus().toggleBold().run();
	};

	const toggleItalic = () => {
		editor?.chain().focus().toggleItalic().run();
	};

	const toggleBulletList = () => {
		editor?.chain().focus().toggleBulletList().run();
	};

	const toggleOrderedList = () => {
		editor?.chain().focus().toggleOrderedList().run();
	};

	const addDivider = () => {
		editor?.chain().focus().setHorizontalRule().run();
	};

	function handleImageClick(img: HTMLImageElement) {
		// Remove previous selection
		if (selectedImage) {
			selectedImage.classList.remove('image-selected');
		}

		selectedImage = img;
		img.classList.add('image-selected');

		// Get current width
		const currentWidth = img.getAttribute('data-width') || img.style.width || '';
		imageWidth = currentWidth;
	}

	function updateImageWidth() {
		if (!selectedImage || !imageWidth || !editor) return;

		const width =
			imageWidth.includes('%') || imageWidth.includes('px') ? imageWidth : `${imageWidth}px`;

		// Update the DOM
		selectedImage.style.width = width;
		selectedImage.setAttribute('data-width', width);

		// Update the TipTap node by finding the image in the document
		const pos = editor.view.posAtDOM(selectedImage, 0);
		if (pos !== null && pos !== undefined) {
			editor
				.chain()
				.focus()
				.setNodeSelection(pos)
				.updateAttributes('resizableImage', { width })
				.run();
		}
	}

	function deselectImage() {
		if (selectedImage) {
			selectedImage.classList.remove('image-selected');
			selectedImage = null;
			imageWidth = '';
		}
	}

	function addImageGrid(files: FileList) {
		gridImages = Array.from(files).map((file) => ({
			src: URL.createObjectURL(file),
			file
		}));
		showGridModal = true;
	}

	async function insertImageGrid() {
		if (!editor || gridImages.length === 0) return;

		uploadingImage = true;
		try {
			// Upload all images
			const uploadedUrls = await Promise.all(
				gridImages.map(async (img) => {
					if (!img.file) return { src: img.src };

					const fileExt = img.file.name.split('.').pop();
					const fileName = `${Math.random()}.${fileExt}`;
					const filePath = `${fileName}`;

					const { error: uploadError, data } = await supabase.storage
						.from('blog-media')
						.upload(filePath, img.file);

					if (uploadError) throw uploadError;

					const { data: urlData } = supabase.storage.from('blog-media').getPublicUrl(filePath);

					return { src: urlData.publicUrl };
				})
			);

			// Use the ImageGrid command to insert properly
			editor.commands.setImageGrid(uploadedUrls, gridColumns);

			// Clean up
			gridImages.forEach((img) => {
				if (img.src.startsWith('blob:')) {
					URL.revokeObjectURL(img.src);
				}
			});

			gridImages = [];
			showGridModal = false;
		} catch (error: any) {
			alert('Error uploading images: ' + error.message);
		} finally {
			uploadingImage = false;
		}
	}

	function cancelGrid() {
		gridImages.forEach((img) => {
			if (img.src.startsWith('blob:')) {
				URL.revokeObjectURL(img.src);
			}
		});
		gridImages = [];
		showGridModal = false;
	}
</script>

<div class="flex h-full flex-col">
	<!-- Editor Container -->
	<div class="container mx-auto flex h-full flex-col px-8 py-4">
		<div class="mb-4 flex items-center justify-between">
			<Button onclick={() => window.history.back()} variant="ghost" class="tiktokFont">
				← Back
			</Button>
			<div class="flex gap-3">
				{#if !publishedAt}
					<Button onclick={saveDraft} disabled={saving} variant="ghost" class="tiktokFont">
						{saving ? 'Saving...' : 'Save Draft'}
					</Button>
				{/if}

				<Button onclick={publishPost} disabled={saving} class="tiktokFont">
					{saving ? 'Publishing...' : 'Publish'}
				</Button>
			</div>
		</div>
		<input
			type="text"
			bind:value={title}
			placeholder="Title"
			class="dmFont mb-4 w-full border-none text-5xl font-bold placeholder-gray-300 outline-none"
		/>
		{#if editor}
			<div class="mb-2 flex flex-wrap items-center gap-2 border-b border-gray-200 pb-4">
				<Button
					onclick={() => setHeading(1)}
					variant="ghost"
					size="icon"
					class="tiktokFont"
					title="Heading 1"
				>
					<Icon icon="gridicons:heading-h1" width={28} />
				</Button>
				<Button
					onclick={() => setHeading(2)}
					variant="ghost"
					size="icon"
					class="tiktokFont"
					title="Heading 2"
				>
					<Icon icon="gridicons:heading-h2" width={28} />
				</Button>
				<Button
					onclick={() => setHeading(3)}
					variant="ghost"
					size="icon"
					class="tiktokFont"
					title="Heading 3"
				>
					<Icon icon="gridicons:heading-h3" width={28} />
				</Button>
				<div class="h-6 w-px bg-gray-300"></div>
				<Button onclick={toggleBold} variant="ghost" size="icon" class="tiktokFont" title="Bold">
					<Icon icon="gridicons:bold" width={20} />
				</Button>
				<Button
					onclick={toggleItalic}
					variant="ghost"
					size="icon"
					class="tiktokFont"
					title="Italic"
				>
					<Icon icon="gridicons:italic" width={20} />
				</Button>
				<div class="h-6 w-px bg-gray-300"></div>
				<Button
					onclick={toggleBulletList}
					variant="ghost"
					size="icon"
					class="tiktokFont"
					title="Bullet List"
				>
					<Icon icon="gridicons:list-unordered" width={24} />
				</Button>
				<Button
					onclick={toggleOrderedList}
					variant="ghost"
					size="icon"
					class="tiktokFont"
					title="Numbered List"
				>
					<Icon icon="gridicons:list-ordered" width={24} />
				</Button>

				<div class="h-6 w-px bg-gray-300"></div>

				<label
					class="cursor-pointer rounded p-2 transition-colors hover:bg-gray-100"
					title="Upload Image"
				>
					<Icon icon="gridicons:image" width={24} />
					<input
						type="file"
						accept="image/*"
						onchange={handleImageUpload}
						class="hidden"
						disabled={uploadingImage}
					/>
				</label>

				<label
					class="cursor-pointer rounded p-2 transition-colors hover:bg-gray-100"
					title="Upload Image Grid"
				>
					<Icon icon="gridicons:grid" width={24} />
					<input
						type="file"
						accept="image/*"
						multiple
						onchange={(e) => {
							const input = e.target as HTMLInputElement;
							if (input.files && input.files.length > 0) {
								addImageGrid(input.files);
								input.value = '';
							}
						}}
						class="hidden"
						disabled={uploadingImage}
					/>
				</label>

				<Button onclick={addYoutubeVideo} variant="ghost" size="icon" title="Embed YouTube">
					<Icon icon="gridicons:video-camera" width={24} />
				</Button>

				<div class="h-6 w-px bg-gray-300"></div>

				<Button onclick={addDivider} variant="ghost" size="icon" title="Add Divider">
					<Icon icon="gridicons:minus" width={24} />
				</Button>
			</div>
		{/if}

		<!-- Image URL Input -->
		{#if showImageInput}
			<div class="mb-4 flex gap-2">
				<input
					type="text"
					bind:value={imageUrl}
					placeholder="Paste image URL..."
					class="flex-1 rounded border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none"
				/>
				<Button onclick={addImageByUrl}>Add</Button>
			</div>
		{/if}

		<!-- Editor -->
		<div
			bind:this={element}
			class="editorContent flex-1 overflow-y-auto"
			role="textbox"
			tabindex="-1"
			onclick={(e) => {
				if (
					e.target === e.currentTarget ||
					(e.target as HTMLElement).classList.contains('ProseMirror')
				) {
					deselectImage();
				}
			}}
			onkeydown={(e) => {
				if (e.key === 'Escape') {
					deselectImage();
				}
			}}
		></div>

		<!-- Image Resize Controls -->
		{#if selectedImage}
			<div
				class="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-lg border border-gray-300 bg-white p-4 shadow-lg"
			>
				<div class="flex items-center gap-2">
					<label for="imageWidth" class="text-sm font-medium">Width:</label>
					<input
						id="imageWidth"
						type="text"
						bind:value={imageWidth}
						placeholder="e.g., 500px, 50%"
						class="w-32 rounded border border-gray-300 px-3 py-1 text-sm focus:ring-2 focus:ring-black focus:outline-none"
					/>
					<Button onclick={updateImageWidth} size="sm">Apply</Button>
				</div>
				<Button onclick={deselectImage} variant="ghost" size="icon" title="Close">
					<Icon icon="gridicons:cross" width={20} />
				</Button>
			</div>
		{/if}
	</div>
</div>

<!-- Grid Modal -->
{#if showGridModal}
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
		<div class="mx-4 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6">
			<h2 class="mb-4 text-2xl font-bold">Create Image Grid</h2>

			<div class="mb-4">
				<p class="mb-2 block text-sm font-medium">Grid Columns:</p>
				<div class="flex gap-2">
					<Button
						onclick={() => (gridColumns = 2)}
						variant={gridColumns === 2 ? 'default' : 'secondary'}
					>
						2 Columns
					</Button>
					<Button
						onclick={() => (gridColumns = 3)}
						variant={gridColumns === 3 ? 'default' : 'secondary'}
					>
						3 Columns
					</Button>
					<Button
						onclick={() => (gridColumns = 4)}
						variant={gridColumns === 4 ? 'default' : 'secondary'}
					>
						4 Columns
					</Button>
				</div>
			</div>

			<div class="mb-4">
				<p class="mb-2 text-sm text-gray-600">
					{gridImages.length} image{gridImages.length !== 1 ? 's' : ''} selected
				</p>
				<div class="grid gap-4" style="grid-template-columns: repeat({gridColumns}, 1fr);">
					{#each gridImages as img}
						<div class="aspect-square overflow-hidden rounded bg-gray-100">
							<img src={img.src} alt="" class="h-full w-full object-cover" />
						</div>
					{/each}
				</div>
			</div>

			<div class="flex justify-end gap-3">
				<Button onclick={cancelGrid} variant="outline">Cancel</Button>
				<Button onclick={insertImageGrid} disabled={uploadingImage}>
					{uploadingImage ? 'Uploading...' : 'Insert Grid'}
				</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(.ProseMirror) {
		outline: none;
	}

	:global(.tiptap.ProseMirror.prose) {
		min-height: 100%;
	}

	:global(.ProseMirror p.is-editor-empty:first-child::before) {
		color: #adb5bd;
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
	}

	:global(.ProseMirror *:first-child) {
		margin-top: 0;
	}

	:global(.ProseMirror h1) {
		font-size: 2.5rem;
		font-weight: 700;
		margin-top: 1rem;
		margin-bottom: 1rem;
		/* font-family: 'TikTok Sans', sans-serif; */
	}

	:global(.ProseMirror h2) {
		font-size: 2rem;
		font-weight: 700;
		margin-top: 1rem;
		margin-bottom: 0.75rem;
		/* font-family: 'TikTok Sans', sans-serif; */
	}

	:global(.ProseMirror h3) {
		font-size: 1.5rem;
		font-weight: 600;
		margin-top: 1rem;
		margin-bottom: 0.5rem;
		/* font-family: 'TikTok Sans', sans-serif; */
	}

	:global(.ProseMirror p) {
		font-size: 1.25rem;
		line-height: 1.5;
		margin-bottom: 1.5rem;
		color: #1a1a1a;
		font-family: 'TikTok Sans', sans-serif;
	}

	:global(.ProseMirror ul, .ProseMirror ol) {
		padding-left: 2rem;
		margin-bottom: 1.5rem;
	}

	:global(.ProseMirror li) {
		font-size: 1.25rem;
		line-height: 1.8;
		margin-bottom: 0.5rem;
	}

	:global(.ProseMirror img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.5rem;
		margin: 2rem 0;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	:global(.ProseMirror img.editor-image) {
		display: block;
		margin-left: auto;
		margin-right: auto;
	}

	:global(.ProseMirror img.image-selected) {
		outline: 3px solid #000;
		outline-offset: 2px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	:global(.ProseMirror .image-grid) {
		display: grid;
		gap: 1rem;
		margin: 2rem 0;
	}

	:global(.ProseMirror .image-grid[data-grid-columns='2']) {
		grid-template-columns: repeat(2, 1fr);
	}

	:global(.ProseMirror .image-grid[data-grid-columns='3']) {
		grid-template-columns: repeat(3, 1fr);
	}

	:global(.ProseMirror .image-grid[data-grid-columns='4']) {
		grid-template-columns: repeat(4, 1fr);
	}

	/* Responsive grid layouts */
	@media (max-width: 768px) {
		:global(.ProseMirror .image-grid[data-grid-columns='4']) {
			grid-template-columns: repeat(2, 1fr);
		}

		:global(.ProseMirror .image-grid[data-grid-columns='3']) {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 480px) {
		:global(.ProseMirror .image-grid) {
			grid-template-columns: 1fr !important;
		}
	}

	:global(.ProseMirror .image-grid img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 0.5rem;
		margin: 0;
		aspect-ratio: 1;
	}

	:global(.ProseMirror hr) {
		border: none;
		border-top: 1px solid var(--border);
		margin: 2rem 0;
	}

	:global(.ProseMirror iframe) {
		max-width: 100%;
		border-radius: 0.5rem;
		margin: 2rem 0;
	}
</style>
