import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		throw redirect(303, '/auth');
	}

	const { data: drafts, error } = await supabase
		.from('posts')
		.select('*')
		.eq('author_id', user.id)
		.eq('published', false)
		.order('updated_at', { ascending: false });

	return {
		drafts: drafts || []
	};
};

export const actions: Actions = {
	delete: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { session, user } = await safeGetSession();

		if (!session || !user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const postId = formData.get('postId');

		if (!postId) {
			return fail(400, { message: 'Post ID is required' });
		}

		const { error } = await supabase
			.from('posts')
			.delete()
			.eq('id', postId)
			.eq('author_id', user.id);

		if (error) {
			return fail(500, { message: 'Failed to delete draft' });
		}

		return { success: true };
	}
};
