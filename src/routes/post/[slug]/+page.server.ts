import type { PageServerLoad, Actions } from './$types';
import { error, redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals: { supabase, safeGetSession } }) => {
	const { session, user } = await safeGetSession();

	const { data: post, error: fetchError } = await supabase
		.from('posts')
		.select('*')
		.eq('slug', params.slug)
		.eq('published', true)
		.single();

	if (fetchError || !post) {
		throw error(404, 'Post not found');
	}

	return {
		post,
		session,
		user
	};
};

export const actions: Actions = {
	delete: async ({ params, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();

		if (!user) {
			return fail(401, { message: 'Unauthorized' });
		}

		// Verify the user owns the post
		const { data: post } = await supabase
			.from('posts')
			.select('author_id')
			.eq('slug', params.slug)
			.single();

		if (!post || post.author_id !== user.id) {
			return fail(403, { message: 'Forbidden' });
		}

		// Delete the post
		const { error: deleteError } = await supabase
			.from('posts')
			.delete()
			.eq('slug', params.slug)
			.eq('author_id', user.id);

		if (deleteError) {
			return fail(500, { message: 'Failed to delete post' });
		}

		throw redirect(303, '/');
	},

	unpublish: async ({ params, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();

		if (!user) {
			return fail(401, { message: 'Unauthorized' });
		}

		// Verify the user owns the post and update to draft
		const { error: updateError } = await supabase
			.from('posts')
			.update({ published: false })
			.eq('slug', params.slug)
			.eq('author_id', user.id);

		if (updateError) {
			return fail(500, { message: 'Failed to unpublish post' });
		}

		throw redirect(303, '/drafts');
	}
};
