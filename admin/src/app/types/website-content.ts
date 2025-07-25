import { FilterParams, PaginationResponse } from './_common';
import { ContentType } from './content-type';

export interface WebsiteContent {
  id: string;
  title: string;
  content: string;
  content_type_id: string;
  image: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  content_type: ContentType;
}

export interface WebsiteContentResponse {
  message: string;
  data: WebsiteContent[];
  pagination: PaginationResponse;
}

export interface WebsiteContentDetailResponse {
  message: string;
  data: WebsiteContent;
}

export interface WebsiteContentRequest {
  title?: string;
  content_type_id?: string;
  content?: string;
  image?: string | null;
  uploadImage?: File | null; // For image upload
  status?: boolean;
}

export interface WebsiteContentFilter extends FilterParams {
  status?: string,
}
