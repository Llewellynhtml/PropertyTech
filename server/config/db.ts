import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The DB file should be in the root relative to this file
const dbPath = path.join(__dirname, "../../proppost.db");
const db = new Database(dbPath);

// Initialize Database with comprehensive schema
export const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS agencies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logo_url TEXT,
      primary_color TEXT,
      secondary_color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'manager', 'agent', 'marketer', 'developer')) NOT NULL,
      office_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agency_id) REFERENCES agencies(id)
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id TEXT,
      title TEXT NOT NULL,
      price REAL NOT NULL,
      currency TEXT DEFAULT 'ZAR',
      location_city TEXT NOT NULL,
      location_area TEXT NOT NULL,
      address_optional TEXT,
      bedrooms INTEGER DEFAULT 0,
      bathrooms INTEGER DEFAULT 0,
      parking INTEGER DEFAULT 0,
      floor_size_m2 INTEGER DEFAULT 0,
      erf_size_m2 INTEGER,
      short_description TEXT,
      long_description TEXT,
      listing_type TEXT CHECK(listing_type IN ('rent', 'sale')) DEFAULT 'sale',
      status TEXT CHECK(status IN ('available', 'sold', 'pending', 'archived')) DEFAULT 'available',
      agent_id INTEGER,
      latitude REAL,
      longitude REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agency_id) REFERENCES agencies(id),
      FOREIGN KEY(agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS amenities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon_optional TEXT
    );

    CREATE TABLE IF NOT EXISTS property_amenities (
      property_id INTEGER,
      amenity_id INTEGER,
      priority_score INTEGER DEFAULT 0,
      PRIMARY KEY (property_id, amenity_id),
      FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE,
      FOREIGN KEY(amenity_id) REFERENCES amenities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS property_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER,
      image_url TEXT NOT NULL,
      caption_optional TEXT,
      sort_order INTEGER DEFAULT 0,
      is_hero BOOLEAN DEFAULT 0,
      FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id TEXT,
      full_name TEXT NOT NULL,
      role_optional TEXT,
      cellphone_number TEXT,
      email TEXT,
      profile_photo_url TEXT,
      whatsapp_number TEXT,
      office_number_optional TEXT,
      bio_optional TEXT,
      linkedin_url_optional TEXT,
      instagram_url_optional TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agency_id) REFERENCES agencies(id)
    );

    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id TEXT,
      name TEXT NOT NULL,
      category TEXT,
      style_theme TEXT,
      supported_formats TEXT,
      thumbnail_url TEXT,
      description TEXT,
      tags TEXT,
      listing_status TEXT,
      version INTEGER DEFAULT 1,
      layout_rules TEXT,
      is_favorite BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agency_id) REFERENCES agencies(id)
    );

    CREATE TABLE IF NOT EXISTS branding (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id TEXT,
      company_name TEXT NOT NULL,
      logo_url TEXT,
      watermark_logo_optional_url TEXT,
      primary_color_hex TEXT DEFAULT '#1E97AB',
      secondary_color_hex TEXT DEFAULT '#359288',
      accent_color_hex TEXT DEFAULT '#518E58',
      background_color_hex TEXT DEFAULT '#FEFEFE',
      heading_font_family TEXT DEFAULT 'Montserrat',
      body_font_family TEXT DEFAULT 'Montserrat',
      website_url TEXT DEFAULT 'www.proppost.co.za',
      default_cta_text TEXT DEFAULT 'WhatsApp Now',
      default_hashtags_optional TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agency_id) REFERENCES agencies(id)
    );

    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id TEXT,
      property_id INTEGER,
      agent_id INTEGER,
      brand_id INTEGER,
      template_id INTEGER,
      platform TEXT,
      aspect_ratio TEXT,
      style TEXT,
      thumbnail_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agency_id) REFERENCES agencies(id),
      FOREIGN KEY(property_id) REFERENCES properties(id),
      FOREIGN KEY(agent_id) REFERENCES agents(id),
      FOREIGN KEY(brand_id) REFERENCES branding(id),
      FOREIGN KEY(template_id) REFERENCES templates(id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id TEXT,
      user_id INTEGER,
      content TEXT,
      visibility TEXT CHECK(visibility IN ('public', 'friends', 'only_me')) DEFAULT 'public',
      location TEXT,
      platform TEXT,
      dimensions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agency_id) REFERENCES agencies(id)
    );

    CREATE TABLE IF NOT EXISTS scheduled_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id TEXT,
      property_id INTEGER,
      agent_id INTEGER,
      property_title TEXT,
      agent_name TEXT,
      platforms TEXT,
      caption TEXT,
      image_url TEXT,
      date TEXT,
      time TEXT,
      status TEXT CHECK(status IN ('scheduled', 'posted', 'failed')) DEFAULT 'scheduled',
      attempts INTEGER DEFAULT 0,
      last_attempt DATETIME,
      failure_reason TEXT,
      publish_status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agency_id) REFERENCES agencies(id),
      FOREIGN KEY(property_id) REFERENCES properties(id),
      FOREIGN KEY(agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id TEXT,
      property_id INTEGER,
      post_id INTEGER,
      agent_id INTEGER,
      source TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      contact_email TEXT,
      status TEXT CHECK(status IN ('New', 'Contacted', 'Qualified', 'Closed', 'Archived')) DEFAULT 'New',
      message TEXT,
      metadata TEXT,
      latitude REAL,
      longitude REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agency_id) REFERENCES agencies(id),
      FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE SET NULL,
      FOREIGN KEY(post_id) REFERENCES scheduled_posts(id) ON DELETE SET NULL,
      FOREIGN KEY(agent_id) REFERENCES agents(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS lead_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      agent_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE,
      FOREIGN KEY(agent_id) REFERENCES agents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lead_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      agent_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date DATETIME,
      completed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE,
      FOREIGN KEY(agent_id) REFERENCES agents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS post_analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      platform TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      impressions INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(post_id) REFERENCES scheduled_posts(id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id TEXT,
      user_id INTEGER,
      post_id INTEGER,
      property_id INTEGER,
      lead_id INTEGER,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agency_id) REFERENCES agencies(id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(post_id) REFERENCES scheduled_posts(id) ON DELETE CASCADE,
      FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE,
      FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id TEXT,
      property_id INTEGER,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agency_id) REFERENCES agencies(id),
      FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS campaign_posts (
      campaign_id INTEGER,
      post_id INTEGER,
      PRIMARY KEY (campaign_id, post_id),
      FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS property_metrics (
      property_id INTEGER PRIMARY KEY,
      posts_created INTEGER DEFAULT 0,
      leads_generated INTEGER DEFAULT 0,
      total_reach INTEGER DEFAULT 0,
      marketing_score INTEGER DEFAULT 0,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
    );

    -- Add columns if they don't exist (for existing databases)
    CREATE TABLE IF NOT EXISTS property_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS scheduled_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      report_type TEXT NOT NULL,
      frequency TEXT CHECK(frequency IN ('daily', 'weekly', 'monthly')) NOT NULL,
      last_run DATETIME,
      next_run DATETIME,
      recipients TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agency_id) REFERENCES agencies(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      threshold REAL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agency_id) REFERENCES agencies(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agency_id) REFERENCES agencies(id)
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      due_date DATETIME,
      completed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  // Helper to add column if it doesn't exist
  const addColumn = (table: string, column: string, type: string) => {
    const info = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
    if (!info.find(c => c.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    }
  };

  addColumn('scheduled_posts', 'attempts', 'INTEGER DEFAULT 0');
  addColumn('scheduled_posts', 'last_attempt', 'DATETIME');
  addColumn('scheduled_posts', 'failure_reason', 'TEXT');
  addColumn('scheduled_posts', 'publish_status', 'TEXT');

  addColumn('properties', 'latitude', 'REAL');
  addColumn('properties', 'longitude', 'REAL');
  addColumn('leads', 'latitude', 'REAL');
  addColumn('leads', 'longitude', 'REAL');

  // Add agency_id to all relevant tables
  const tablesToUpdate = [
    'users', 'properties', 'agents', 'templates', 'posts', 
    'scheduled_posts', 'leads', 'branding'
  ];
  tablesToUpdate.forEach(table => addColumn(table, 'agency_id', 'TEXT'));
  addColumn('properties', 'agent_id', 'INTEGER');
  addColumn('properties', 'status', "TEXT CHECK(status IN ('available', 'sold', 'pending', 'archived')) DEFAULT 'available'");
  addColumn('leads', 'status', "TEXT CHECK(status IN ('New', 'Contacted', 'Qualified', 'Closed', 'Archived')) DEFAULT 'New'");

  db.exec(`
    CREATE TABLE IF NOT EXISTS post_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      media_url TEXT NOT NULL,
      media_type TEXT CHECK(media_type IN ('image', 'video')) NOT NULL,
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
    );
  `);

  // Seed initial data if empty
  const agencyCount = db.prepare("SELECT COUNT(*) as count FROM agencies").get() as { count: number };
  let defaultAgencyId = "";

  if (agencyCount.count === 0) {
    defaultAgencyId = randomUUID();
    db.prepare(`
      INSERT INTO agencies (id, name, logo_url, primary_color, secondary_color)
      VALUES (?, ?, ?, ?, ?)
    `).run(defaultAgencyId, "GroupTen Agency", "https://picsum.photos/seed/agency/400/200", "#1E97AB", "#359288");
  } else {
    const agency = db.prepare("SELECT id FROM agencies LIMIT 1").get() as { id: string };
    defaultAgencyId = agency.id;
  }

  const propertyCount = db.prepare("SELECT COUNT(*) as count FROM properties").get() as { count: number };
  if (propertyCount.count === 0) {
    // Seed Amenities
    const initialAmenities = [
      "4 Spacious Bedrooms", "2 Modern Bathrooms", "Open-plan Living Room", "Fully Equipped Kitchen",
      "Dining Area", "Built-in Wardrobes", "Air Conditioning", "Ceiling Fans", "Modern Lighting Fixtures",
      "Tiled or Wooden Floors", "1 Garage / Covered Parking", "Secure Parking Area", "Private Entrance",
      "Storage Room", "Laundry Area", "Walk-in Closet", "Guest Bathroom", "Private Garden",
      "Landscaped Yard", "Outdoor Patio", "Balcony", "Swimming Pool", "Braai Area / BBQ Area",
      "Outdoor Lighting", "Security Gates", "Electric Fence", "Alarm System", "CCTV Cameras",
      "Intercom System", "Burglar Bars", "24/7 Security", "High-Speed Internet Ready", "Fibre Internet",
      "Smart TV Ready", "Solar Power Option", "Backup Power / Inverter", "Water Tank",
      "Energy Efficient Windows", "Ensuite Bathroom", "Modern Kitchen Island", "Granite Countertops",
      "Double Garage", "Home Office", "Entertainment Area", "Fireplace"
    ];
    const insertAmenity = db.prepare("INSERT INTO amenities (name) VALUES (?)");
    initialAmenities.forEach(a => insertAmenity.run(a));

    // Seed Agents
    const insertAgent = db.prepare(`
      INSERT INTO agents (agency_id, full_name, role_optional, profile_photo_url, email, whatsapp_number, cellphone_number, linkedin_url_optional, instagram_url_optional)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    [
      [defaultAgencyId, "Sarah Jenkins", "Senior Property Consultant", "https://picsum.photos/seed/agent1/400/400", "sarah@groupten.co.za", "27821234567", "27821234567", "https://linkedin.com/in/sarahjenkins", "https://instagram.com/sarahjenkins_realty"],
      [defaultAgencyId, "Mark Thompson", "Leasing Specialist", "https://picsum.photos/seed/agent2/400/400", "mark@groupten.co.za", "27827654321", "27827654321", "https://linkedin.com/in/markthompson", "https://instagram.com/mark_leasing"],
      [defaultAgencyId, "Elena Rodriguez", "Luxury Portfolio Manager", "https://picsum.photos/seed/agent3/400/400", "elena@groupten.co.za", "27829998888", "27829998888", "https://linkedin.com/in/elenarodriguez", "https://instagram.com/elena_luxury_homes"]
    ].forEach(a => insertAgent.run(...a));

    // Seed Branding
    db.prepare(`
      INSERT INTO branding (agency_id, company_name, logo_url, primary_color_hex, secondary_color_hex, accent_color_hex, background_color_hex, heading_font_family, body_font_family, website_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      defaultAgencyId,
      "GroupTen Properties",
      "https://picsum.photos/seed/logo/400/200",
      "#1E97AB",
      "#359288",
      "#518E58",
      "#FEFEFE",
      "Montserrat",
      "Montserrat",
      "www.groupten.co.za"
    );

    // Seed Properties
    const insertProp = db.prepare(`
      INSERT INTO properties (agency_id, title, price, location_city, location_area, bedrooms, bathrooms, parking, floor_size_m2, short_description, listing_type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const properties = [
      [defaultAgencyId, "Luxury Ocean View Villa", 8500000, "Cape Town", "Camps Bay", 4, 3, 2, 350, "A stunning modern villa with panoramic ocean views.", "sale", "available"],
      [defaultAgencyId, "Modern Penthouse", 4500000, "Johannesburg", "Sandton", 2, 2, 2, 120, "Chic urban living in the heart of Sandton.", "sale", "available"],
      [defaultAgencyId, "Family Home with Garden", 3200000, "Durban", "Umhlanga", 3, 2, 2, 200, "Perfect family home with a spacious garden and pool.", "sale", "available"],
      [defaultAgencyId, "Cozy Studio Apartment", 12000, "Cape Town", "Sea Point", 1, 1, 1, 45, "Fully furnished studio steps away from the promenade.", "rent", "available"],
      [defaultAgencyId, "Executive Office Suite", 25000, "Pretoria", "Brooklyn", 0, 2, 4, 150, "Prime office space in a secure business park.", "rent", "available"]
    ];

    properties.forEach(p => {
      const result = insertProp.run(...p);
      const propertyId = result.lastInsertRowid;

      // Link Amenities with priority scores
      const amenityIds = db.prepare("SELECT id FROM amenities").all() as { id: number }[];
      const linkAmenity = db.prepare("INSERT INTO property_amenities (property_id, amenity_id, priority_score) VALUES (?, ?, ?)");
      amenityIds.forEach((a, i) => {
        if (Math.random() > 0.7) {
          linkAmenity.run(propertyId, a.id, Math.floor(Math.random() * 100));
        }
      });

      // Seed Images
      const insertImage = db.prepare("INSERT INTO property_images (property_id, image_url, is_hero, sort_order) VALUES (?, ?, ?, ?)");
      for (let i = 0; i < 6; i++) {
        insertImage.run(propertyId, `https://picsum.photos/seed/prop${propertyId}_${i}/1920/1080`, i === 0 ? 1 : 0, i);
      }
    });
  }

  // Seed Templates (Wipe first to ensure exactly 2 as requested)
  db.prepare("DELETE FROM templates").run();
  db.prepare("DELETE FROM sqlite_sequence WHERE name='templates'").run();
  const insertTemplate = db.prepare(`
    INSERT INTO templates (agency_id, name, category, style_theme, supported_formats, thumbnail_url, description, tags, listing_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const templates = [
    [defaultAgencyId, "Luxury Real Estate Flyer", "for_sale", "luxury", JSON.stringify(["1200x630"]), "https://picsum.photos/seed/flyer/1200/630", "Luxury, Modular, Professional, Facebook", "for_sale", "active"],
    [defaultAgencyId, "Exclusive Living Flyer", "for_sale", "luxury", JSON.stringify(["1200x630", "16:9"]), "https://picsum.photos/seed/exclusive/1100/620", "Exclusive, Luxury, Gold, Navy", "for_sale", "active"]
  ];

  templates.forEach(t => insertTemplate.run(...t));

  // Seed Analytics and more Leads if empty
  const analyticsCount = db.prepare("SELECT COUNT(*) as count FROM post_analytics").get() as { count: number };
  if (analyticsCount.count === 0) {
    let posts = db.prepare("SELECT id, property_id, agent_id FROM scheduled_posts").all() as any[];
    
    // If no posts, let's create some dummy ones first to have data to analyze
    if (posts.length === 0) {
      const properties = db.prepare("SELECT id, title FROM properties").all() as any[];
      const agents = db.prepare("SELECT id, full_name FROM agents").all() as any[];
      
      const insertPost = db.prepare(`
        INSERT INTO scheduled_posts (agency_id, property_id, agent_id, property_title, agent_name, platforms, status, date, time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const platforms = ['facebook', 'instagram', 'linkedin'];
      properties.forEach((p, i) => {
        const agent = agents[i % agents.length];
        const result = insertPost.run(
          defaultAgencyId,
          p.id, 
          agent.id, 
          p.title, 
          agent.full_name, 
          JSON.stringify([platforms[i % platforms.length]]), 
          'posted',
          '2024-03-01',
          '10:00'
        );
        posts.push({ id: result.lastInsertRowid, property_id: p.id, agent_id: agent.id });
      });
    }

    const insertAnalytics = db.prepare(`
      INSERT INTO post_analytics (post_id, platform, likes, comments, shares, clicks, impressions)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertLead = db.prepare(`
      INSERT INTO leads (agency_id, property_id, post_id, agent_id, source, contact_name, contact_phone, message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    posts.forEach(post => {
      const platform = 'facebook'; // Simplified for seeding
      insertAnalytics.run(
        post.id,
        platform,
        Math.floor(Math.random() * 50),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 5),
        Math.floor(Math.random() * 100),
        Math.floor(Math.random() * 1000) + 500
      );

      // Add a lead for some posts
      if (Math.random() > 0.3) {
        insertLead.run(
          defaultAgencyId,
          post.property_id,
          post.id,
          post.agent_id,
          platform,
          "John Doe",
          "0821234567",
          "I am interested in this property."
        );
      }
    });
  }

  // Seed default admin user if no users exist
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (userCount.count === 0) {
    const passwordHash = bcrypt.hashSync("admin123", 10);
    db.prepare(`
      INSERT INTO users (agency_id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(defaultAgencyId, "System Admin", "admin@proppost.co.za", passwordHash, "admin");
    console.log("Default admin user created: admin@proppost.co.za / admin123");
  }
};

export default db;

