export type UserRole = 'agent' | 'agency';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  agency_name?: string;
  agency_id?: string;
}

export interface Agent {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  cellphone?: string;
  whatsapp_number?: string;
  job_title?: string;
  ppra_number?: string;
  bio?: string;
  specialisation?: string;
  areas?: string[];
  instagram_url?: string;
  agency_id?: string;
  status: string;
}

export interface Agency {
  id: string;
  created_at: string;
  agency_name: string;
  trading_name?: string;
  email: string;
  office_number?: string;
  province?: string;
  city?: string;
  address?: string;
  website_url?: string;
  agent_count_range?: string;
  join_code: string;
  plan: string;
  plan_agent_limit: number;
  plan_post_limit: number;
  plan_platform_limit: number;
  trial_ends_at?: string;
}

export interface Property {
  id: string;
  created_at: string;
  title: string;
  price: number;
  city: string;
  area: string;
  beds: number;
  baths: number;
  parking: number;
  size: number;
  listing_type: 'sale' | 'rent';
  description: string;
  images: string[];
  image_urls: string[];
  status: string;
  featured: boolean;
  created_by_id: string;
  created_by_role: string;
  agency_id?: string;
  agent_id?: string;
}

export type LeadStatus = 'new' | 'contacted' | 'appointment' | 'negotiating' | 'closed' | 'lost' | 'New' | 'Contacted' | 'Qualified' | 'Closed' | 'Archived' | 'All';

export interface LeadTask {
  id: string;
  lead_id: string;
  title: string;
  due_date: string;
  dueDate?: string;
  completed: boolean;
}

export interface Lead {
  id: string;
  created_at: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  status: LeadStatus;
  property_id?: string;
  agent_id?: string;
  source?: string;
  notes?: string;
  tasks?: LeadTask[];
  agent_name?: string;
  // Temporary camelCase aliases for component compatibility
  contactName?: string;
  contactEmail?: string;
  propertyTitle?: string;
  agentName?: string;
}

export interface Amenity {
  id: string;
  name: string;
  icon: string;
}

export interface Schedule {
  id: string;
  created_at: string;
  property_id?: string;
  agent_id?: string;
  property_title?: string;
  agent_name?: string;
  platforms: string[];
  caption?: string;
  image_url?: string;
  scheduled_at: string;
  status: string;
  template_format?: string;
  template_design?: string;
  style_overrides: any;
}

export interface Branding {
  id: string;
  agency_id: string;
  company_name: string;
  primary_color: string;
  secondary_color: string;
}

export const SA_PROVINCES = [
  { code: 'GP', name: 'Gauteng' },
  { code: 'WC', name: 'Western Cape' },
  { code: 'KZN', name: 'KwaZulu-Natal' },
  { code: 'EC', name: 'Eastern Cape' },
  { code: 'FS', name: 'Free State' },
  { code: 'LP', name: 'Limpopo' },
  { code: 'MP', name: 'Mpumalanga' },
  { code: 'NW', name: 'North West' },
  { code: 'NC', name: 'Northern Cape' },
];

export const PLAN_LIMITS: Record<string, { label: string; price: number; agents: number; posts: number; platforms: number }> = {
  free: { label: 'Starter', price: 0, agents: 3, posts: 5, platforms: 2 },
  growth: { label: 'Growth', price: 499, agents: 15, posts: -1, platforms: 6 },
  scale: { label: 'Scale', price: 1499, agents: -1, posts: -1, platforms: 6 },
};
