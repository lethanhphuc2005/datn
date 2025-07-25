import { Comment } from './comment';
import { FilterParams, PaginationResponse } from './_common';
import { FeatureRoomClass } from './feature';
import { Image } from './image';
import { MainRoomClass } from './main-room-class';
import { Review } from './review';
import { Room } from './room';

export interface RoomClass {
  id: string;
  main_room_class_id: string;
  name: string;
  description: string;
  bed_amount: number;
  capacity: number;
  price: number;
  price_discount: number;
  view: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  main_room_class: MainRoomClass;
  rooms?: Room[];
  features?: FeatureRoomClass[];
  images?: Image[];
  reviews: Review[];
  comments: Comment[];
  showFeatures?: boolean; // Optional for toggling feature visibility
}

export interface RoomClassResponse {
  message: string;
  data: RoomClass[];
  pagination: PaginationResponse;
}

export interface RoomClassDetailResponse {
  message: string;
  data: RoomClass;
}

export interface RoomClassRequest {
  main_room_class_id?: string;
  name?: string;
  description?: string;
  bed_amount?: number;
  capacity?: number;
  price?: number;
  price_discount?: number;
  view?: string;
  status?: boolean;
  images?: string[] | null;
  uploadImages?: File[] | null;
  features?: string[];
}

export interface RoomClassFilter extends FilterParams {
  status?: string;
  feature?: string;
  type?: string;
  minBed?: number;
  maxBed?: number;
  minCapacity?: number;
  maxCapacity?: number;
}
