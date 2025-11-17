<script lang="ts">
	import mainStore from '$lib/stores/main.svelte';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';

	let user: any = $state(null);

	onMount(async () => {
		const { data: userData } = await supabase.auth.getUser();
		user = userData.user;
	});
</script>

<footer class="mt-auto border-t border-gray-200">
	<div class="container mx-auto px-4 py-6">
		<div class="flex items-center justify-between">
			<!-- Copyright Text -->
			<p class="tiktokFont text-sm text-gray-600">
				© {new Date().getFullYear()} Tasteee. All rights reserved.
			</p>

			<!-- Auth Icon -->
			{#if !user}
				<button
					onclick={mainStore.signIn}
					class="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
					aria-label="Sign in"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
							clip-rule="evenodd"
						/>
					</svg>
					<span class="tiktokFont text-sm">Sign In</span>
				</button>
			{/if}
		</div>
	</div>
</footer>
