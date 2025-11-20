<script lang="ts">
	import type { PageData } from './$types';
	import Icon from '@iconify/svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { enhance } from '$app/forms';

	let { data }: { data: PageData } = $props();
	const post = data.post;
	const user = data.user;

	let deleteDialogOpen = $state(false);
	let isDeleting = $state(false);
	let isUnpublishing = $state(false);

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Helper to render Tiptap JSON content as HTML
	function renderTiptapContent(content: any): string {
		if (!content || !content.content) {
			return '';
		}

		let html = '';

		for (const node of content.content) {
			html += renderNode(node);
		}

		return html;
	}

	function renderNode(node: any): string {
		const type = node.type;
		const content = node.content || [];
		const attrs = node.attrs || {};

		switch (type) {
			case 'paragraph':
				return `<p class="text-xl leading-relaxed mb-6 text-gray-800">${renderChildren(content)}</p>`;

			case 'heading':
				const level = attrs.level || 1;
				const sizes = {
					1: 'text-4xl font-bold mt-12 mb-6',
					2: 'text-3xl font-bold mt-10 mb-5',
					3: 'text-2xl font-semibold mt-8 mb-5'
				};
				return `<h${level} class="${sizes[level as keyof typeof sizes] || sizes[1]}">${renderChildren(content)}</h${level}>`;

			case 'bulletList':
				return `<ul class="list-disc pl-8 mb-6 space-y-2">${renderChildren(content)}</ul>`;

			case 'orderedList':
				return `<ol class="list-decimal pl-8 mb-6 space-y-2">${renderChildren(content)}</ol>`;

			case 'listItem':
				return `<li class="text-xl leading-relaxed text-gray-800">${renderChildren(content)}</li>`;

			case 'resizableImage':
			case 'image':
				const width = attrs.width || attrs['data-width'];
				const widthStyle = width ? `width: ${width}${typeof width === 'number' ? 'px' : ''}; ` : '';
				const imgClasses = 'rounded-lg my-8';
				return `<img src="${attrs.src}" alt="${attrs.alt || ''}" class="${imgClasses}" style="${widthStyle}max-width: 100%; height: auto; display: block; margin-left: auto; margin-right: auto;" />`;

			case 'imageGrid':
				const columns = attrs.columns || 2;
				return `<div class="image-grid my-8" data-grid-columns="${columns}">${renderChildren(content)}</div>`;

			case 'youtube':
				return `<div class="aspect-video my-8"><iframe src="${attrs.src}" class="w-full h-full rounded-lg" frameborder="0" allowfullscreen></iframe></div>`;

			case 'horizontalRule':
				return '<hr class="my-6 border-gray-300" />';

			case 'text':
				let text = node.text || '';
				if (node.marks) {
					for (const mark of node.marks) {
						if (mark.type === 'bold') {
							text = `<strong class="font-bold">${text}</strong>`;
						}
						if (mark.type === 'italic') {
							text = `<em class="italic">${text}</em>`;
						}
						if (mark.type === 'code') {
							text = `<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">${text}</code>`;
						}
					}
				}
				return text;

			default:
				return renderChildren(content);
		}
	}

	function renderChildren(content: any[]): string {
		if (!content || !content.length) {
			return '';
		}
		return content.map((node) => renderNode(node)).join('');
	}
</script>

<svelte:head>
	<title>{post.title}</title>
	<meta name="description" content={post.excerpt || ''} />
</svelte:head>

<div class="flex h-full flex-col">
	<!-- Article -->
	<article class="relative container mx-auto flex h-full w-full flex-col overflow-y-auto px-8 py-4">
		<div class="backLink flex w-full items-center justify-between">
			<div class="backButtonBox">
				<Button onclick={() => window.history.back()} variant="ghost" class="tiktokFont">
					← Back
				</Button>
			</div>
			{#if user && post.author_id === user.id}
				<div class="flex items-center gap-2">
					<Button href="/editor?id={post.id}" variant="ghost" class="tiktokFont">
						<Icon icon="gridicons:pencil" width={16} />
						Edit
					</Button>

					<form
						method="POST"
						action="?/unpublish"
						use:enhance={() => {
							isUnpublishing = true;
							return async ({ update }) => {
								await update();
								isUnpublishing = false;
							};
						}}
					>
						<Button type="submit" disabled={isUnpublishing} variant="ghost" class="tiktokFont">
							<Icon icon="mdi:archive-arrow-down" width={16} />
							{isUnpublishing ? 'Unpublishing...' : 'Unpublish'}
						</Button>
					</form>

					<Button
						onclick={() => (deleteDialogOpen = true)}
						variant="ghost"
						class="tiktokFont text-red-600 hover:text-red-800"
					>
						<Icon icon="mdi:delete" width={16} />
						Delete
					</Button>
				</div>

				<AlertDialog.Root bind:open={deleteDialogOpen}>
					<AlertDialog.Content>
						<AlertDialog.Header>
							<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
							<AlertDialog.Description>
								This action cannot be undone. This will permanently delete your post "{post.title}".
							</AlertDialog.Description>
						</AlertDialog.Header>
						<AlertDialog.Footer>
							<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
							<form
								method="POST"
								action="?/delete"
								use:enhance={() => {
									isDeleting = true;
									return async ({ update }) => {
										await update();
										isDeleting = false;
									};
								}}
							>
								<AlertDialog.Action type="submit" disabled={isDeleting}>
									{isDeleting ? 'Deleting...' : 'Delete'}
								</AlertDialog.Action>
							</form>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			{/if}
		</div>

		<h1 class="mt-6 text-5xl font-bold md:text-6xl">
			{post.title}
		</h1>

		<div class="postDate tiktokFont mb-4 flex items-center text-gray-600">
			<time datetime={post.created_at}>
				{formatDate(post.created_at)}
			</time>
		</div>

		<!-- Content Area -->
		<div class="postContent flex-1">
			<!-- Featured Image -->
			{#if post.featured_image}
				<img src={post.featured_image} alt={post.title} class="mb-12 h-auto w-full rounded-lg" />
			{/if}

			<!-- Content -->
			<div class="prose prose-lg max-w-none">
				{#if post.content}
					{@html renderTiptapContent(post.content)}
				{/if}
			</div>
		</div>
	</article>
</div>

<style lang="postcss">
	:global(.prose) {
		max-width: none;
	}

	:global(.prose :first-child) {
		margin-top: 0;
	}

	:global(.prose a) {
		color: #1a1a1a;
		text-decoration: underline;
	}

	:global(.prose a:hover) {
		color: #4b5563;
	}

	:global(.prose p) {
		font-family: 'TikTok Sans', sans-serif;
	}

	/* Image Grid Styles */
	:global(.image-grid) {
		display: grid;
		gap: 1rem;
		margin: 2rem 0;
	}

	:global(.image-grid[data-grid-columns='2']) {
		grid-template-columns: repeat(2, 1fr);
	}

	:global(.image-grid[data-grid-columns='3']) {
		grid-template-columns: repeat(3, 1fr);
	}

	:global(.image-grid[data-grid-columns='4']) {
		grid-template-columns: repeat(4, 1fr);
	}

	/* Responsive grid layouts */
	@media (max-width: 768px) {
		:global(.image-grid[data-grid-columns='4']) {
			grid-template-columns: repeat(2, 1fr);
		}

		:global(.image-grid[data-grid-columns='3']) {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 480px) {
		:global(.image-grid) {
			grid-template-columns: 1fr !important;
		}
	}

	:global(.image-grid img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 0.5rem;
		margin: 0 !important;
		aspect-ratio: 1;
	}

	.backLink {
		position: relative;
		z-index: 10;
		width: 100%;
	}
</style>
