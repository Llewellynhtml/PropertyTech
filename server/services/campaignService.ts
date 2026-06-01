import db from "../config/db.js";
import { propertyService } from "./propertyService.js";
import { metricsService } from "./metricsService.js";

export const campaignService = {
  generateCampaign: (propertyId: string | number, agencyId: string, userId: number) => {
    const property = propertyService.getById(propertyId, agencyId);
    if (!property) throw new Error("Property not found");

    // Fetch agent info (using the first agent for now, or we could pass agentId)
    const agent = db.prepare("SELECT * FROM agents WHERE agency_id = ? LIMIT 1").get(agencyId) as any;
    const agentName = agent ? agent.full_name : "Our Team";

    const amenitiesList = property.amenities.map((a: any) => `• ${a.name}`).join("\n");
    
    const platforms = ["Instagram", "Facebook", "LinkedIn"];
    const campaignName = `Campaign for ${property.title} - ${new Date().toLocaleDateString()}`;

    const transaction = db.transaction(() => {
      // 1. Create Campaign
      const campaignResult = db.prepare(`
        INSERT INTO campaigns (agency_id, property_id, name)
        VALUES (?, ?, ?)
      `).run(agencyId, propertyId, campaignName);
      
      const campaignId = campaignResult.lastInsertRowid;

      // 2. Generate Posts
      const generatedPosts = platforms.map(platform => {
        const caption = `🏡 ${property.title}\n\n📍 ${property.location_area}, ${property.location_city}\n\n💰 Price: ${property.currency} ${property.price.toLocaleString()}\n\nFeatures:\n${amenitiesList}\n\nContact ${agentName} today.`;

        const postResult = db.prepare(`
          INSERT INTO posts (agency_id, user_id, content, platform, location)
          VALUES (?, ?, ?, ?, ?)
        `).run(agencyId, userId, caption, platform, `${property.location_area}, ${property.location_city}`);
        
        const postId = postResult.lastInsertRowid;

        // 3. Attach Images (1 hero, 2 supporting)
        const heroImage = property.images.find((img: any) => img.is_hero) || property.images[0];
        const supportingImages = property.images.filter((img: any) => !img.is_hero).slice(0, 2);
        
        const imagesToAttach = [heroImage, ...supportingImages].filter(Boolean);
        
        const insertMedia = db.prepare(`
          INSERT INTO post_media (post_id, media_url, media_type)
          VALUES (?, ?, 'image')
        `);

        imagesToAttach.forEach((img: any) => {
          insertMedia.run(postId, img.image_url);
        });

        // 4. Link Post to Campaign
        db.prepare(`
          INSERT INTO campaign_posts (campaign_id, post_id)
          VALUES (?, ?)
        `).run(campaignId, postId);

        return { id: postId, platform, caption };
      });

      // Update property marketing score
      metricsService.updateMetrics(propertyId);

      return { campaignId, posts: generatedPosts };
    });

    return transaction();
  },

  getCampaignsByProperty: (propertyId: string | number, agencyId: string) => {
    return db.prepare("SELECT * FROM campaigns WHERE property_id = ? AND agency_id = ? ORDER BY created_at DESC").all(propertyId, agencyId);
  }
};
