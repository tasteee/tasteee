<script lang="ts">
	import type { PageData } from './$types';
	import Icon from '@iconify/svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { enhance } from '$app/forms';

	let { data }: { data: PageData } = $props();

	let deletingId = $state<string | null>(null);
	let openDialogId = $state<string | null>(null);

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function openDeleteDialog(id: string) {
		openDialogId = id;
	}

	function closeDeleteDialog() {
		openDialogId = null;
	}
</script>

<svelte:head>
	<title>Drafts - Tasteee</title>
</svelte:head>

<div class="flex h-full flex-col overflow-hidden">
	<main class="container mx-auto flex flex-1 flex-col overflow-hidden px-8 py-8">
		<div class="mb-8 flex items-center justify-between">
			<h1 class="text-4xl font-bold">Your Drafts</h1>
			<Button href="/editor" class="tiktokFont">
				<Icon icon="gridicons:create" width={20} />
				New Draft
			</Button>
		</div>

		<div class="min-h-0 flex-1 overflow-y-auto">
			{#if data.drafts && data.drafts.length > 0}
				<div class="space-y-6">
					{#each data.drafts as draft}
						<article class="tiCard overflow-hidden">
							<div class="p-6">
								<div class="mb-3 flex items-start justify-between">
									<h2 class="flex-1 text-2xl font-bold">
										{draft.title}
									</h2>
									<span
										class="tiktokFont ml-4 rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700"
									>
										Draft
									</span>
								</div>
								{#if draft.excerpt}
									<p class="mb-4 line-clamp-2 text-gray-600">
										{draft.excerpt}
									</p>
								{/if}
								<div class="tiktokFont flex items-center justify-between text-sm text-gray-500">
									<time datetime={draft.updated_at}>
										Last edited {formatDate(draft.updated_at)}
									</time>
									<div class="flex gap-2">
										<Button href="/editor?id={draft.id}" variant="outline">
											<Icon icon="gridicons:pencil" width={16} />
											Edit
										</Button>
										<AlertDialog.Root
											open={openDialogId === draft.id}
											onOpenChange={(open) => {
												if (!open) closeDeleteDialog();
											}}
										>
											<AlertDialog.Trigger
												onclick={() => openDeleteDialog(draft.id)}
												class="flex items-center gap-2 rounded-lg border-2 border-red-300 px-4 py-2 font-medium text-red-700 transition-colors hover:border-red-400 hover:bg-red-50"
												disabled={deletingId === draft.id}
											>
												<Icon icon="gridicons:trash" width={16} />
												Delete
											</AlertDialog.Trigger>
											<AlertDialog.Content>
												<AlertDialog.Header>
													<AlertDialog.Title>Delete Draft?</AlertDialog.Title>
													<AlertDialog.Description>
														Are you sure you want to delete "{draft.title}"? This action cannot be
														undone.
													</AlertDialog.Description>
												</AlertDialog.Header>
												<AlertDialog.Footer>
													<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
													<form
														method="POST"
														action="?/delete"
														use:enhance={() => {
															deletingId = draft.id;
															return async ({ update }) => {
																await update();
																deletingId = null;
																closeDeleteDialog();
															};
														}}
													>
														<input type="hidden" name="postId" value={draft.id} />
														<AlertDialog.Action type="submit" class="bg-red-600 hover:bg-red-700">
															Delete
														</AlertDialog.Action>
													</form>
												</AlertDialog.Footer>
											</AlertDialog.Content>
										</AlertDialog.Root>
									</div>
								</div>
							</div>
						</article>
					{/each}
				</div>
			{:else}
				<div class="py-20 text-center">
					<Icon icon="gridicons:pages" width={64} class="mx-auto mb-4 text-gray-400" />
					<h2 class="mb-4 text-2xl text-gray-600">No drafts yet</h2>
					<p class="tiktokFont mb-6 text-gray-500">
						Start writing and save as draft to see them here
					</p>
					<a
						href="/editor"
						class="inline-block rounded-lg bg-black px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800"
					>
						Write your first post
					</a>
				</div>
			{/if}
		</div>
	</main>
</div>
