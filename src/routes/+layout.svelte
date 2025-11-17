<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import TopBar from '$lib/components/TopBar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';
	import mainStore from '$lib/stores/main.svelte';

	let { children } = $props();

	let showFooter = $state(!$page.url.pathname.startsWith('/editor'));

	onMount(() => {
		// Verify authentication on page load
		supabase.auth.onAuthStateChange(async (event, session) => {
			if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
				await mainStore.refreshUser();
			}
		});

		// Initial auth check
		mainStore.refreshUser();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex h-screen flex-col overflow-hidden">
	<TopBar />

	<main class="flex-1 overflow-hidden">
		{@render children()}
	</main>

	<!-- {#if showFooter}
		<Footer />
	{/if} -->
</div>
