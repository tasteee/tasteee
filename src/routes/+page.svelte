<script lang="ts">
	import type { PageData } from './$types';
	import mainStore from '$lib/stores/main.svelte';
	import { supabase } from '$lib/supabaseClient';
	import Icon from '@iconify/svelte';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let searchInput = $state(data.searchQuery || '');
	let sortOrder = $state(data.sortOrder || 'published-newest');
	let posts = $state(data.posts || []);
	let isSearching = $state(false);

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	async function handleSearch() {
		isSearching = true;

		let query = supabase.from('posts').select('*').eq('published', true);

		// Apply search filter if provided
		if (searchInput.trim()) {
			const searchTerm = searchInput.trim();
			query = query.or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`);
		}

		// Apply sorting
		switch (sortOrder) {
			case 'published-newest':
				query = query.order('published_at', { ascending: false });
				break;
			case 'published-oldest':
				query = query.order('published_at', { ascending: true });
				break;
			case 'edited-newest':
				query = query.order('updated_at', { ascending: false });
				break;
			case 'edited-oldest':
				query = query.order('updated_at', { ascending: true });
				break;
			case 'alphabetical-az':
				query = query.order('title', { ascending: true });
				break;
			case 'alphabetical-za':
				query = query.order('title', { ascending: false });
				break;
			default:
				query = query.order('published_at', { ascending: false });
		}

		const { data: fetchedPosts, error } = await query;

		if (!error && fetchedPosts) {
			posts = fetchedPosts;
		}

		isSearching = false;
	}

	const sortOptions = [
		{ value: 'published-newest', label: 'Published (Newest)' },
		{ value: 'published-oldest', label: 'Published (Oldest)' },
		{ value: 'edited-newest', label: 'Edited (Newest)' },
		{ value: 'edited-oldest', label: 'Edited (Oldest)' },
		{ value: 'alphabetical-az', label: 'Alphabetical (A-Z)' },
		{ value: 'alphabetical-za', label: 'Alphabetical (Z-A)' }
	];

	const triggerContent = $derived(
		sortOptions.find((s) => s.value === sortOrder)?.label ?? 'Sort order'
	);

	$effect(() => {
		// Trigger search when sortOrder changes
		handleSearch();
	});
</script>

<div class="flex h-full flex-col overflow-hidden">
	<!-- Main Content -->
	<main class="postsList container mx-auto flex flex-1 flex-col overflow-hidden px-8 py-8">
		<div class="mb-8 flex items-center justify-between">
			<h1 class="text-4xl font-bold">Posts</h1>
			<Button onclick={() => goto('/editor')}>
				<Icon icon="gridicons:create" width={20} />
				New Post
			</Button>
		</div>
		<!-- Search and Sort Controls -->
		<div class="mb-6 flex items-center gap-3">
			<Input
				type="text"
				bind:value={searchInput}
				placeholder="Search posts..."
				class="flex-1"
				onkeydown={(e) => e.key === 'Enter' && handleSearch()}
			/>
			<Select.Root type="single" bind:value={sortOrder}>
				<Select.Trigger class="w-[220px]">
					{triggerContent}
				</Select.Trigger>
				<Select.Content>
					{#each sortOptions as option (option.value)}
						<Select.Item value={option.value} label={option.label}>
							{option.label}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<Button onclick={handleSearch} class="" aria-label="Search" disabled={isSearching}>
				{#if isSearching}
					<div
						class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"
					></div>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
				{/if}
			</Button>
		</div>

		<div class="min-h-0 flex-1 overflow-y-auto">
			{#if posts && posts.length > 0}
				<div class="space-y-4">
					{#each posts as post}
						<article class="tiCard overflow-hidden">
							<a href="/post/{post.slug}" class="block p-4">
								{#if post.featured_image}
									<img
										src={post.featured_image}
										alt={post.title}
										class="mb-6 h-64 w-full object-cover"
									/>
								{/if}
								<h2 class="mb-3 text-3xl font-bold transition-colors">
									{post.title}
								</h2>
								{#if post.excerpt}
									<p class="tiktokFont mb-4 line-clamp-3 text-lg text-gray-600">
										{post.excerpt}
									</p>
								{/if}
								<div class="tiktokFont flex items-center text-sm text-gray-500">
									<time datetime={post.created_at}>
										{formatDate(post.created_at)}
									</time>
								</div>
							</a>
						</article>
					{/each}
				</div>
			{:else}
				<div class="py-20 text-center">
					<h2 class="mb-4 text-2xl text-gray-600">No posts yet</h2>
					{#if mainStore.user}
						<Button href="/editor">Write your first post</Button>
					{:else}
						<p class="tiktokFont text-gray-500">Sign in to start writing</p>
					{/if}
				</div>
			{/if}
		</div>
	</main>
</div>
