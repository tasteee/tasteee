<script lang="ts">
	import { supabase } from '$lib/supabaseClient';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';

	let email = '';
	let password = '';
	let loading = false;
	let error = '';
	let isSignUp = false;

	async function handleAuth(event: Event) {
		event.preventDefault();
		loading = true;
		error = '';

		try {
			if (isSignUp) {
				const { error: signUpError } = await supabase.auth.signUp({
					email,
					password
				});
				if (signUpError) throw signUpError;
				error = 'Check your email for the confirmation link!';
			} else {
				const { error: signInError } = await supabase.auth.signInWithPassword({
					email,
					password
				});
				if (signInError) throw signInError;
				goto('/');
			}
		} catch (e: any) {
			error = e.message;
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center px-4">
	<div class="w-full max-w-md space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-bold text-gray-900">
				{isSignUp ? 'Create your account' : 'Sign in to your account'}
			</h2>
		</div>

		<form class="mt-8 space-y-6" onsubmit={handleAuth}>
			<div class="-space-y-px rounded-md shadow-sm">
				<div>
					<label for="email" class="sr-only">Email address</label>
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						required
						bind:value={email}
						class="relative block w-full appearance-none rounded-t-md border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-black focus:ring-2 focus:ring-black focus:outline-none sm:text-sm"
						placeholder="Email address"
					/>
				</div>
				<div>
					<label for="password" class="sr-only">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="current-password"
						required
						bind:value={password}
						class="relative block w-full appearance-none rounded-b-md border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-black focus:ring-2 focus:ring-black focus:outline-none sm:text-sm"
						placeholder="Password"
					/>
				</div>
			</div>

			{#if error}
				<div
					class="text-center text-sm {isSignUp && error.includes('email')
						? 'text-green-600'
						: 'text-red-600'}"
				>
					{error}
				</div>
			{/if}

			<div>
				<Button type="submit" disabled={loading} class="w-full">
					{loading ? 'Loading...' : isSignUp ? 'Sign up' : 'Sign in'}
				</Button>
			</div>

			<div class="text-center">
				<Button
					type="button"
					variant="ghost"
					onclick={() => {
						isSignUp = !isSignUp;
						error = '';
					}}
					class="text-sm"
				>
					{isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
				</Button>
			</div>
		</form>
	</div>
</div>
