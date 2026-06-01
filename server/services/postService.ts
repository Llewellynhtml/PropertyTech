import db from "../config/db.js";

export const postService = {
  getAll: (agencyId: string) => {
    const posts = db.prepare("SELECT * FROM posts WHERE agency_id = ? ORDER BY created_at DESC").all(agencyId) as any[];
    return posts.map(post => {
      const media = db.prepare("SELECT * FROM post_media WHERE post_id = ?").all(post.id);
      return { ...post, media };
    });
  },

  create: (data: any, agencyId: string) => {
    const { content, visibility, location, platform, dimensions, media } = data;
    
    const transaction = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO posts (agency_id, content, visibility, location, platform, dimensions)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(agencyId, content, visibility || 'public', location, platform, dimensions);
      
      const postId = result.lastInsertRowid;
      
      if (media && Array.isArray(media)) {
        const insertMedia = db.prepare(`
          INSERT INTO post_media (post_id, media_url, media_type)
          VALUES (?, ?, ?)
        `);
        for (const item of media) {
          insertMedia.run(postId, item.url, item.type);
        }
      }
      
      return postId;
    });

    return transaction();
  }
};
