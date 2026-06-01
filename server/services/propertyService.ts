import db from "../config/db.js";

export const propertyService = {
  getAll: (agencyId: string) => {
    const properties = db.prepare(`
      SELECT p.*, pm.marketing_score, pm.posts_created, pm.leads_generated, pm.total_reach
      FROM properties p
      LEFT JOIN property_metrics pm ON p.id = pm.property_id
      WHERE p.agency_id = ?
    `).all(agencyId) as any[];
    return properties.map(p => {
      const amenities = db.prepare(`
        SELECT a.id, a.name, pa.priority_score FROM amenities a 
        JOIN property_amenities pa ON a.id = pa.amenity_id 
        WHERE pa.property_id = ?
      `).all(p.id) as { id: number, name: string, priority_score: number }[];
      
      const images = db.prepare("SELECT * FROM property_images WHERE property_id = ? ORDER BY sort_order ASC").all(p.id);
      
      return { 
        ...p, 
        amenities, 
        images,
        metrics: {
          marketing_score: p.marketing_score || 0,
          posts_created: p.posts_created || 0,
          leads_generated: p.leads_generated || 0,
          total_reach: p.total_reach || 0
        }
      };
    });
  },

  getById: (id: string | number, agencyId: string) => {
    const property = db.prepare(`
      SELECT p.*, pm.marketing_score, pm.posts_created, pm.leads_generated, pm.total_reach
      FROM properties p
      LEFT JOIN property_metrics pm ON p.id = pm.property_id
      WHERE p.id = ? AND p.agency_id = ?
    `).get(id, agencyId) as any;
    if (!property) return null;

    const amenities = db.prepare(`
      SELECT a.id, a.name, pa.priority_score FROM amenities a 
      JOIN property_amenities pa ON a.id = pa.amenity_id 
      WHERE pa.property_id = ?
      ORDER BY pa.priority_score DESC
    `).all(id) as { id: number, name: string, priority_score: number }[];
    
    const images = db.prepare("SELECT * FROM property_images WHERE property_id = ? ORDER BY sort_order ASC").all(id);
    
    // Computed defaults
    const defaultSelectedImages = images.slice(0, 6).map((img: any) => img.image_url);
    const defaultAmenitiesToShow = amenities.slice(0, 6).map((a: any) => a.name);
    const defaultHeadline = property.title;
    const defaultCaption = `Check out this ${property.listing_type === 'sale' ? 'stunning home for sale' : 'great rental opportunity'} in ${property.location_area}, ${property.location_city}. Featuring ${property.bedrooms} beds and ${property.bathrooms} baths.`;

    return { 
      ...property, 
      amenities, 
      images,
      metrics: {
        marketing_score: property.marketing_score || 0,
        posts_created: property.posts_created || 0,
        leads_generated: property.leads_generated || 0,
        total_reach: property.total_reach || 0
      },
      defaults: {
        defaultSelectedImages,
        defaultAmenitiesToShow,
        defaultHeadline,
        defaultCaption
      }
    };
  },

  create: (data: any, agencyId: string) => {
    const { title, price, location_city, location_area, bedrooms, bathrooms, parking, floor_size_m2, short_description, listing_type, status, agent_id, amenities, images } = data;
    
    const transaction = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO properties (agency_id, title, price, location_city, location_area, bedrooms, bathrooms, parking, floor_size_m2, short_description, listing_type, status, agent_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(agencyId, title, price, location_city, location_area, bedrooms, bathrooms, parking, floor_size_m2, short_description, listing_type, status || 'available', agent_id);
      
      const propertyId = result.lastInsertRowid;

      if (amenities && Array.isArray(amenities)) {
        const linkAmenity = db.prepare("INSERT INTO property_amenities (property_id, amenity_id) VALUES (?, ?)");
        amenities.forEach(amenityId => linkAmenity.run(propertyId, amenityId));
      }

      if (images && Array.isArray(images)) {
        const insertImage = db.prepare("INSERT INTO property_images (property_id, image_url, is_hero, sort_order) VALUES (?, ?, ?, ?)");
        images.forEach((img: any, i: number) => insertImage.run(propertyId, img.url, i === 0 ? 1 : 0, i));
      }

      return propertyId;
    });

    return transaction();
  },

  update: (id: string | number, data: any, agencyId: string) => {
    const { title, price, location_city, location_area, bedrooms, bathrooms, parking, floor_size_m2, short_description, listing_type, status, agent_id, amenities, images } = data;
    
    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE properties 
        SET title = ?, price = ?, location_city = ?, location_area = ?, bedrooms = ?, bathrooms = ?, parking = ?, floor_size_m2 = ?, short_description = ?, listing_type = ?, status = ?, agent_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND agency_id = ?
      `).run(title, price, location_city, location_area, bedrooms, bathrooms, parking, floor_size_m2, short_description, listing_type, status, agent_id, id, agencyId);
      
      // Update amenities
      db.prepare("DELETE FROM property_amenities WHERE property_id = ?").run(id);
      if (amenities && Array.isArray(amenities)) {
        const linkAmenity = db.prepare("INSERT INTO property_amenities (property_id, amenity_id) VALUES (?, ?)");
        amenities.forEach(amenityId => linkAmenity.run(id, amenityId));
      }

      // Update images
      db.prepare("DELETE FROM property_images WHERE property_id = ?").run(id);
      if (images && Array.isArray(images)) {
        const insertImage = db.prepare("INSERT INTO property_images (property_id, image_url, is_hero, sort_order) VALUES (?, ?, ?, ?)");
        images.forEach((img: any, i: number) => insertImage.run(id, img.url, i === 0 ? 1 : 0, i));
      }

      return true;
    });

    return transaction();
  },

  delete: (id: string | number, agencyId: string) => {
    const transaction = db.transaction(() => {
      // Verify ownership
      const property = db.prepare("SELECT id FROM properties WHERE id = ? AND agency_id = ?").get(id, agencyId);
      if (!property) return 0;

      // Delete related history first
      db.prepare("DELETE FROM history WHERE property_id = ?").run(id);
      const result = db.prepare("DELETE FROM properties WHERE id = ?").run(id);
      return result.changes;
    });

    return transaction();
  },

  duplicate: (id: string | number, agencyId: string) => {
    const transaction = db.transaction(() => {
      const property = db.prepare("SELECT * FROM properties WHERE id = ? AND agency_id = ?").get(id, agencyId) as any;
      if (!property) throw new Error("Property not found");

      const result = db.prepare(`
        INSERT INTO properties (agency_id, title, price, location_city, location_area, bedrooms, bathrooms, parking, floor_size_m2, short_description, listing_type, status, agent_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(agencyId, `${property.title} (Copy)`, property.price, property.location_city, property.location_area, property.bedrooms, property.bathrooms, property.parking, property.floor_size_m2, property.short_description, property.listing_type, 'available', property.agent_id);
      
      const newPropertyId = result.lastInsertRowid;

      const amenities = db.prepare("SELECT amenity_id, priority_score FROM property_amenities WHERE property_id = ?").all(id) as any[];
      const linkAmenity = db.prepare("INSERT INTO property_amenities (property_id, amenity_id, priority_score) VALUES (?, ?, ?)");
      amenities.forEach(a => linkAmenity.run(newPropertyId, a.amenity_id, a.priority_score));

      const images = db.prepare("SELECT image_url, is_hero, sort_order FROM property_images WHERE property_id = ?").all(id) as any[];
      const insertImage = db.prepare("INSERT INTO property_images (property_id, image_url, is_hero, sort_order) VALUES (?, ?, ?, ?)");
      images.forEach(img => insertImage.run(newPropertyId, img.image_url, img.is_hero, img.sort_order));

      return newPropertyId;
    });

    return transaction();
  },

  archive: (id: string | number, agencyId: string) => {
    return db.prepare("UPDATE properties SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND agency_id = ?").run(id, agencyId);
  }
};
