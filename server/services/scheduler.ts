import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { publishPost } from '../workers/postWorker.js';

let postQueue: Queue | null = null;
const fallbackTimers = new Map<number, NodeJS.Timeout>();

if (process.env.REDIS_URL) {
  const connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: true,
    connectTimeout: 5000,
  }) as any;

  connection.on('error', (err: any) => {
    console.warn('[Redis] Connection failed:', err.message);
  });

  postQueue = new Queue('post-publishing', { connection });
  console.log('[Scheduler] BullMQ initialized with Redis');
} else {
  console.log('[Scheduler] REDIS_URL not found. Using in-memory fallback scheduler.');
}

export const schedulerService = {
  schedulePost: async (postId: number, scheduledAt: Date) => {
    const delay = scheduledAt.getTime() - Date.now();
    
    if (postQueue) {
      // Use BullMQ if available
      await postQueue.add('publish-post', { postId }, {
        jobId: `post-${postId}`,
        delay: Math.max(0, delay),
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      });
    } else {
      // Fallback to setTimeout
      if (fallbackTimers.has(postId)) {
        clearTimeout(fallbackTimers.get(postId));
      }

      const timer = setTimeout(async () => {
        try {
          await publishPost(postId);
          fallbackTimers.delete(postId);
        } catch (error) {
          console.error(`[Fallback Scheduler] Failed to publish post ${postId}:`, error);
        }
      }, Math.max(0, delay));

      fallbackTimers.set(postId, timer);
    }
    
    console.log(`Scheduled post ${postId} with delay ${delay}ms (${postQueue ? 'BullMQ' : 'In-memory'})`);
  },

  cancelPost: async (postId: number) => {
    if (postQueue) {
      const job = await postQueue.getJob(`post-${postId}`);
      if (job) {
        await job.remove();
      }
    } else {
      if (fallbackTimers.has(postId)) {
        clearTimeout(fallbackTimers.get(postId));
        fallbackTimers.delete(postId);
      }
    }
    console.log(`Cancelled scheduled job for post ${postId}`);
  }
};
