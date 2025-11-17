<script lang="ts">
	import mainStore from '$lib/stores/main.svelte';
	import { onMount } from 'svelte';

	onMount(async () => {
		mainStore.refreshUser();
	});
</script>

<header class="TopBar">
	<div class="container mx-auto px-4 py-4">
		<div class="flex items-center justify-between">
			<!-- Logo -->
			<a href="/" class="flex items-center transition-opacity hover:opacity-80">
				<img src="/logo.svg" alt="Tasteee" class="h-8" />
			</a>

			<!-- Navigation Links -->
			<nav class="flex items-center gap-6">
				<a href="/" class="text-gray-600 transition-colors hover:text-gray-900"> Posts </a>
				{#if mainStore.user}
					<a href="/drafts" class="text-gray-600 transition-colors hover:text-gray-900"> Drafts </a>
					<div class="ml-4 flex items-center gap-3">
						<a
							href="/editor"
							class="flex h-8 w-8 items-center justify-center text-gray-900 transition-colors hover:text-gray-600"
							aria-label="New Post"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
									clip-rule="evenodd"
								/>
							</svg>
						</a>
						<button
							onclick={mainStore.signOut}
							class="text-gray-600 transition-colors hover:text-gray-900"
						>
							Sign Out
						</button>
					</div>
				{/if}
			</nav>
		</div>
	</div>
</header>

<style>
	.TopBar {
		/* border-bottom: 1px solid var(--border); */
	}
</style>
