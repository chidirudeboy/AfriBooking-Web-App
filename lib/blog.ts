import { baseUrl } from './config/environment';
import { TBlogPost } from './types/blog';

const BLOGS_API = `${baseUrl}/blogs`;

async function handleBlogResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Blog request failed with status ${response.status}`);
  }

  const payload = await response.json();
  return payload.data as T;
}

export async function getPublishedBlogs(limit?: number): Promise<TBlogPost[]> {
  try {
    const query = limit ? `?limit=${limit}` : '';
    const response = await fetch(`${BLOGS_API}${query}`, {
      next: { revalidate: 300 },
    });

    return await handleBlogResponse<TBlogPost[]>(response);
  } catch (_error) {
    return [];
  }
}

export async function getBlogBySlug(slug: string): Promise<TBlogPost | null> {
  try {
    const response = await fetch(`${BLOGS_API}/${slug}`, {
      next: { revalidate: 300 },
    });

    if (response.status === 404) {
      return null;
    }

    return await handleBlogResponse<TBlogPost>(response);
  } catch (_error) {
    return null;
  }
}
