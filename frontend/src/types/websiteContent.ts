import { PaginationResponse } from "./_common";
import { ContentType } from "./contentType";

export interface WebsiteContent {
  id: string;
  content_type_id: string;
  title: string;
  content: string;
  image: string;
  content_type: ContentType[];
  status: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WebsiteContentResponse {
  success: boolean;
  message?: string;
  data: WebsiteContent;
}

export interface WebsiteContentListResponse {
  success: boolean;
  message?: string;
  data: WebsiteContent[];
  pagination?: PaginationResponse;
}