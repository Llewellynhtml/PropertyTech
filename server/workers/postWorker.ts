import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import db from '../config/db.js';
import { metricsService } from '../services/metricsService.js';

export const publishPost = async (postId: number) => {
  const post = db.prepare("SELECT * FROM scheduled_posts WHERE id = ?").get(postId) as any;
  if (!post) {
    console.warn(`[Publish] Post ${postId} not found in database, skipping.`);
    return;
  }

  try {
    // Mock publishing logic
    const platforms = JSON.parse(post.platforms);
    console.log(`[Publish] Publishing post ${postId} to: ${platforms.join(', ')}`);
    
    // Simulate network latency/API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Update database on success
    db.prepare(`
      UPDATE scheduled_posts 
      SET status = 'posted', 
          publish_status = 'success',
          attempts = attempts + 1,
          last_attempt = CURRENT_TIMESTAMP,
          failure_reason = NULL
      WHERE id = ?
    `).run(postId);

    // Add to history for tracking
    const brand = db.prepare("SELECT id FROM branding LIMIT 1").get() as { id: number };
    const insertHistory = db.prepare(`
      INSERT INTO history (property_id, agent_id, brand_id, platform, aspect_ratio, style, thumbnail_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    platforms.forEach((p: string) => {
      insertHistory.run(post.property_id, post.agent_id, brand?.id || 1, p, '1:1', 'Modern', post.image_url);
    });

    // Update property marketing score
    metricsService.updateMetrics(post.property_id);

    console.log(`[Publish] Successfully published post ${postId}`);
  } catch (error: any) {
    console.error(`[Publish] Failed to publish post ${postId}: ${error.message}`);
    
    db.prepare(`
      UPDATE scheduled_posts 
      SET status = 'failed', 
          publish_status = 'error',
          failure_reason = ?,
          attempts = attempts + 1,
          last_attempt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(error.message, postId);

    throw error;
  }
};

export const initPostWorker = () => {
  if (!process.env.REDIS_URL) {
    console.log("[Worker] REDIS_URL not found. BullMQ worker disabled.");
    return null;
  }

  const connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: true,
    connectTimeout: 5000,
  }) as any;

  connection.on('error', (err: any) => {
    console.warn('[Worker Redis] Connection failed:', err.message);
  });

  const worker = new Worker('post-publishing', async (job: Job) => {
    const { postId } = job.data;
    console.log(`[Worker] Processing job ${job.id} for post ${postId}`);
    await publishPost(postId);
  }, { 
    connection,
    concurrency: 5
  });

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
  });

  return worker;
};
