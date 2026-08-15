export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type Status = 'Pending' | 'In Progress' | 'Resolved';
export type Category =
  | 'Infrastructure'
  | 'Water & Sanitation'
  | 'Electricity & Power'
  | 'Waste Management'
  | 'Public Transport';

export interface Issue {
  id: string;
  user_id: string;
  title: string;
  category: Category;
  description: string;
  image_url: string | null;
  status: Status;
  priority: Priority;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
}