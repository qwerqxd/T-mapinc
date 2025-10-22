
import { type Timestamp } from 'firebase/firestore';

export type User = {
  uid: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: 'user' | 'admin';
  createdAt?: Timestamp | Date | string;
};

export type ReviewMedia = {
  type: 'image' | 'video';
  url: string;
  storagePath?: string;
}

export type Review = {
  id: string;
  markerId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  text: string;
  rating: number; // 1-5
  createdAt: Timestamp | Date | string; 
  updatedAt?: Timestamp | Date | string;
  media?: ReviewMedia[];
};

export type MarkerData = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  createdBy: string; // user ID
};



