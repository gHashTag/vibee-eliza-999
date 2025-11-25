import { z } from 'zod';

// Схемы валидации для Instagram
export const InstagramPostSchema = z.object({
  caption: z.string().min(1).max(2200),
  imageUrl: z.string().url().optional(),
  mediaType: z.enum(['IMAGE', 'VIDEO', 'CAROUSEL']).default('IMAGE'),
  hashtags: z.array(z.string()).optional(),
  locationId: z.string().optional(),
});

export const InstagramStorySchema = z.object({
  mediaUrl: z.string().url(),
  mediaType: z.enum(['IMAGE', 'VIDEO']).default('IMAGE'),
  caption: z.string().max(300).optional(),
});

export const InstagramMetricsSchema = z.object({
  postId: z.string(),
  metrics: z.array(z.enum([
    'impressions',
    'reach',
    'engagement',
    'likes',
    'comments',
    'shares',
    'saves',
  ])),
});

export type InstagramPost = z.infer<typeof InstagramPostSchema>;
export type InstagramStory = z.infer<typeof InstagramStorySchema>;
export type InstagramMetrics = z.infer<typeof InstagramMetricsSchema>;

// Интерфейс для Instagram API
export interface InstagramService {
  publishPost(post: InstagramPost): Promise<any>;
  publishStory(story: InstagramStory): Promise<any>;
  getMetrics(metrics: InstagramMetrics): Promise<any>;
  getAccountInfo(): Promise<any>;
  getMediaLibrary(limit?: number): Promise<any>;
}
