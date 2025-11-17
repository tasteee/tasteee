import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase }, url }) => {
	const searchQuery = url.searchParams.get('search') || '';
	const sortOrder = url.searchParams.get('sort') || 'published-newest';

	let query = supabase.from('posts').select('*').eq('published', true);

	// Apply search filter if provided
	if (searchQuery) {
		query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
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

	const { data: posts, error } = await query;

	return {
		posts: posts || [],
		searchQuery,
		sortOrder
	};
};
