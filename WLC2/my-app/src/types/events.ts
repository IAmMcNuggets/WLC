/**
 * Event and activity related type definitions
 */

export interface Participant {
  id: number;
  member_id: number;
  member_name: string;
  member_email: string;
  assignment_type: string;
}

export interface Activity {
  id: number;
  subject: string;
  description: string;
  location: string;
  regarding_id: number;
  regarding_type: string;
  starts_at: string;
  ends_at: string;
  activity_status_name: string;
  activity_type_name: string;
  completed: boolean;
  participants: Participant[];
  regarding?: {
    subject: string;
    number: string;
  };
}

export interface OpportunityDocument {
  id: number;
  opportunity_id: number;
  document_id: number;
  status: number;
  view_count: number;
  uuid: string;
  created_at: string;
  updated_at: string;
  name: string;
}

export interface ItemAsset {
  id: number;
  stock_level_asset_number: string;
  item_id: number;
}

export interface OpportunityItem {
  id: number;
  name: string;
  quantity: number;
  opportunity_item_type_name: string;
  price: string;
  description?: string;
  attachable_id?: number;
  item_id?: number;
  item_assets?: ItemAsset[];
  item_type?: string;
}

export interface Attachment {
  id: number;
  attachable_id: number;
  name: string;
  description: string;
  attachment_file_name: string;
  attachment_content_type: string;
  attachment_file_size: number;
  attachment_url: string;
  attachment_thumb_url: string;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: number;
  subject: string;
  description: string;
  starts_at: string;
  ends_at: string;
  status_name: string;
  number: string;
  venue: {
    name: string;
  };
  billing_address: {
    name: string;
    street: string;
    city: string;
    county: string;
    postcode: string;
    country_name: string;
  };
  custom_fields: {
    'on-site_contact_phone': string;
    [key: string]: string | number | boolean;
  };
  opportunity_items: OpportunityItem[];
  destination: {
    address: {
      street: string;
      city: string;
      county: string;
      postcode: string;
    };
  };
  attachments?: Attachment[];
}

export interface EventsProps {
  user: import('./user').GoogleUser | null;
}

export interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
}

export type ApiResponse<T> = {
  data: T;
  // Add other properties as needed
}; 