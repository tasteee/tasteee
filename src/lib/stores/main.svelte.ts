import { supabase } from '$lib/supabaseClient';
import { goto } from '$app/navigation';

class MainStore {
	user = $state(null) as any;

	isAuthenticated = $derived(!!this.user);

	signIn = async () => {
		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'github',
			options: {
				redirectTo: `${window.location.origin}/auth`
			}
		});

		if (error) console.error('Error signing in:', error);
	};

	signOut = async () => {
		await supabase.auth.signOut();
		this.user = null;
		goto('/auth');
	};

	refreshUser = async () => {
		const { data: userData } = await supabase.auth.getUser();
		this.user = userData.user;
	};
}

const mainStore = new MainStore();
export default mainStore;
