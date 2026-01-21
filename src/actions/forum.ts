'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Types
export interface ForumThread {
    id: string;
    title: string;
    slug: string;
    content: Record<string, unknown>;
    view_count: number;
    reply_count: number;
    is_pinned: boolean;
    is_locked: boolean;
    created_at: string;
    last_activity_at: string;
    author: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
    };
    category_id?: string;
    category?: {
        id: string;
        name: string;
        slug: string;
    };
}

export interface ForumPost {
    id: string;
    content: Record<string, unknown>;
    is_accepted_answer: boolean;
    created_at: string;
    updated_at: string;
    parent_id: string | null;
    author: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
    };
}

export interface ForumCategory {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    sort_order: number;
    is_read_only: boolean;
    thread_count?: number;
}

interface ThreadWithCategory extends ForumThread {
    category: {
        id: string;
        name: string;
        slug: string;
        course_id: string | null;
    };
}

// Get all forum categories for a course
export async function getForumCategories(courseId: string): Promise<ForumCategory[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('forum_categories')
        .select(`
            id,
            name,
            slug,
            description,
            icon,
            color,
            sort_order,
            is_read_only,
            is_active
        `)
        .eq('course_id', courseId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }

    // Get thread counts for each category
    const categoriesWithCounts: ForumCategory[] = [];

    for (const cat of (data || [])) {
        const { count } = await supabase
            .from('forum_threads')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', cat.id)
            .eq('is_deleted', false);

        categoriesWithCounts.push({
            ...cat,
            thread_count: count || 0,
        });
    }

    return categoriesWithCounts;
}

// Get or create the default category for a course
async function getOrCreateCourseCategory(courseId: string): Promise<string> {
    const supabase = await createClient();

    // Check if category for this course exists
    const { data: existing } = await supabase
        .from('forum_categories')
        .select('id')
        .eq('course_id', courseId)
        .single();

    if (existing) {
        return existing.id;
    }

    // Get course info to create category
    const { data: course } = await supabase
        .from('courses')
        .select('title, slug')
        .eq('id', courseId)
        .single();

    if (!course) {
        throw new Error('Course not found');
    }

    // Get user's organization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('current_org_id')
        .eq('id', user.id)
        .single();

    // Create default category for course
    const { data: newCategory, error } = await supabase
        .from('forum_categories')
        .insert({
            name: `Foro: ${course.title}`,
            slug: `course-${course.slug}`,
            description: `Foro de discusión del curso ${course.title}`,
            course_id: courseId,
            allowed_roles: ['public'],
        })
        .select('id')
        .single();

    if (error) throw error;
    return newCategory.id;
}

// Get threads for a course (from all categories)
export async function getForumThreads(courseId: string): Promise<ForumThread[]> {
    const supabase = await createClient();

    // Get ALL categories for this course
    const { data: categories } = await supabase
        .from('forum_categories')
        .select('id')
        .eq('course_id', courseId)
        .eq('is_active', true);

    if (!categories || categories.length === 0) {
        return [];
    }

    // Get category IDs
    const categoryIds = categories.map(c => c.id);

    const { data, error } = await supabase
        .from('forum_threads')
        .select(`
            id,
            title,
            slug,
            content,
            view_count,
            reply_count,
            is_pinned,
            is_locked,
            created_at,
            last_activity_at,
            category_id,
            author:users!forum_threads_author_id_fkey (
                id,
                full_name,
                avatar_url
            ),
            category:forum_categories!forum_threads_category_id_fkey (
                id,
                name,
                slug
            )
        `)
        .in('category_id', categoryIds)
        .eq('is_deleted', false)
        .order('is_pinned', { ascending: false })
        .order('last_activity_at', { ascending: false });

    if (error) {
        console.error('Error fetching threads:', error);
        return [];
    }

    return (data || []).map(thread => ({
        ...thread,
        author: Array.isArray(thread.author) ? thread.author[0] : thread.author,
        category: Array.isArray(thread.category) ? thread.category[0] : thread.category,
    })) as ForumThread[];
}

// Get single thread with posts
export async function getThreadById(threadId: string): Promise<{
    thread: ForumThread | null;
    posts: ForumPost[];
}> {
    const supabase = await createClient();

    // Get thread
    const { data: thread, error: threadError } = await supabase
        .from('forum_threads')
        .select(`
            id,
            title,
            slug,
            content,
            view_count,
            reply_count,
            is_pinned,
            is_locked,
            created_at,
            last_activity_at,
            author:users!forum_threads_author_id_fkey (
                id,
                full_name,
                avatar_url
            ),
            category:forum_categories!forum_threads_category_id_fkey (
                id,
                name,
                slug
            )
        `)
        .eq('id', threadId)
        .eq('is_deleted', false)
        .single();

    if (threadError || !thread) {
        return { thread: null, posts: [] };
    }

    // Increment view count
    await supabase
        .from('forum_threads')
        .update({ view_count: (thread.view_count || 0) + 1 })
        .eq('id', threadId);

    // Get posts
    const { data: posts } = await supabase
        .from('forum_posts')
        .select(`
            id,
            content,
            is_accepted_answer,
            created_at,
            updated_at,
            parent_id,
            author:users!forum_posts_author_id_fkey (
                id,
                full_name,
                avatar_url
            )
        `)
        .eq('thread_id', threadId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

    const formattedThread = {
        ...thread,
        author: Array.isArray(thread.author) ? thread.author[0] : thread.author,
        category: Array.isArray(thread.category) ? thread.category[0] : thread.category,
    } as ForumThread;

    const formattedPosts = (posts || []).map(post => ({
        ...post,
        author: Array.isArray(post.author) ? post.author[0] : post.author,
    })) as ForumPost[];

    return { thread: formattedThread, posts: formattedPosts };
}

// Create new thread
export async function createThread(
    courseId: string,
    title: string,
    content: Record<string, unknown>
): Promise<{ success: boolean; threadId?: string; error?: string }> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Get user's organization
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('current_org_id')
        .eq('id', user.id)
        .single();

    if (!profile?.current_org_id) {
        return { success: false, error: 'No organization' };
    }

    try {
        const categoryId = await getOrCreateCourseCategory(courseId);

        // Generate slug from title
        const slug = title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            + '-' + Date.now().toString(36);

        const { data, error } = await supabase
            .from('forum_threads')
            .insert({
                category_id: categoryId,
                organization_id: profile.current_org_id,
                author_id: user.id,
                title,
                slug,
                content,
            })
            .select('id')
            .single();

        if (error) throw error;

        revalidatePath('/academy');
        return { success: true, threadId: data.id };
    } catch (err) {
        console.error('Error creating thread:', err);
        return { success: false, error: 'Failed to create thread' };
    }
}

// Create reply/post
export async function createPost(
    threadId: string,
    content: Record<string, unknown>,
    parentId?: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Get user's organization
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('current_org_id')
        .eq('id', user.id)
        .single();

    if (!profile?.current_org_id) {
        return { success: false, error: 'No organization' };
    }

    // Check if thread is locked
    const { data: thread } = await supabase
        .from('forum_threads')
        .select('is_locked')
        .eq('id', threadId)
        .single();

    if (thread?.is_locked) {
        return { success: false, error: 'Thread is locked' };
    }

    const { data, error } = await supabase
        .from('forum_posts')
        .insert({
            thread_id: threadId,
            organization_id: profile.current_org_id,
            author_id: user.id,
            content,
            parent_id: parentId || null,
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error creating post:', error);
        return { success: false, error: 'Failed to create post' };
    }

    revalidatePath('/academy');
    return { success: true, postId: data.id };
}

// Update post
export async function updatePost(
    postId: string,
    content: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
        .from('forum_posts')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', postId)
        .eq('author_id', user.id);

    if (error) {
        console.error('Error updating post:', error);
        return { success: false, error: 'Failed to update post' };
    }

    revalidatePath('/academy');
    return { success: true };
}

// Delete post (soft delete)
export async function deletePost(postId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
        .from('forum_posts')
        .update({ is_deleted: true })
        .eq('id', postId)
        .eq('author_id', user.id);

    if (error) {
        console.error('Error deleting post:', error);
        return { success: false, error: 'Failed to delete post' };
    }

    revalidatePath('/academy');
    return { success: true };
}

// Toggle pin (admin only)
export async function toggleThreadPin(threadId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { data: thread } = await supabase
        .from('forum_threads')
        .select('is_pinned')
        .eq('id', threadId)
        .single();

    if (!thread) {
        return { success: false, error: 'Thread not found' };
    }

    const { error } = await supabase
        .from('forum_threads')
        .update({ is_pinned: !thread.is_pinned })
        .eq('id', threadId);

    if (error) {
        return { success: false, error: 'Failed to toggle pin' };
    }

    revalidatePath('/academy');
    return { success: true };
}

// Toggle lock (admin only)
export async function toggleThreadLock(threadId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { data: thread } = await supabase
        .from('forum_threads')
        .select('is_locked')
        .eq('id', threadId)
        .single();

    if (!thread) {
        return { success: false, error: 'Thread not found' };
    }

    const { error } = await supabase
        .from('forum_threads')
        .update({ is_locked: !thread.is_locked })
        .eq('id', threadId);

    if (error) {
        return { success: false, error: 'Failed to toggle lock' };
    }

    revalidatePath('/academy');
    return { success: true };
}

// Mark post as accepted answer
export async function markAsAnswer(postId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Get post's thread
    const { data: post } = await supabase
        .from('forum_posts')
        .select('thread_id')
        .eq('id', postId)
        .single();

    if (!post) {
        return { success: false, error: 'Post not found' };
    }

    // Check if user is thread author
    const { data: thread } = await supabase
        .from('forum_threads')
        .select('author_id')
        .eq('id', post.thread_id)
        .single();

    if (thread?.author_id !== user.id) {
        return { success: false, error: 'Only thread author can mark answers' };
    }

    // Unmark all other answers in thread first
    await supabase
        .from('forum_posts')
        .update({ is_accepted_answer: false })
        .eq('thread_id', post.thread_id);

    // Mark this post as answer
    const { error } = await supabase
        .from('forum_posts')
        .update({ is_accepted_answer: true })
        .eq('id', postId);

    if (error) {
        return { success: false, error: 'Failed to mark as answer' };
    }

    revalidatePath('/academy');
    return { success: true };
}
