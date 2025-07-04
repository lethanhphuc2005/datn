import {
  getRoomClasses as getRoomClassesApi,
  getRoomClassById as getRoomClassByIdApi,
} from "@/api/roomClassApi";
import { Review } from "@/types/review";
import { RoomClass } from "@/types/roomClass";

export const fetchRoomClasses = async (): Promise<{
  success: boolean;
  message?: string;
  data: RoomClass[];
}> => {
  try {
    const response = await getRoomClassesApi();
    const data = response.data;
    const roomClasses: RoomClass[] = data.map((rc: any) => ({
      id: rc.id || rc._id,
      main_room_class_id: rc.main_room_class_id || "",
      name: rc.name,
      bed_amount: rc.bed_amount || 0,
      capacity: rc.capacity || 0,
      price: rc.price || 0,
      price_discount: rc.price_discount || 0,
      view: rc.view || "",
      description: rc.description || "",
      status: rc.status || false,
      created_at: rc.createdAt ? new Date(rc.createdAt) : undefined,
      updated_at: rc.updated_at ? new Date(rc.updated_at) : undefined,
      main_room_class: rc.main_room_class,
      images: rc.images
        ? rc.images.map((img: any) => ({
            id: img.id || img._id,
            url: img.url,
            target: img.target || "",
            created_at: img.createdAt ? new Date(img.createdAt) : undefined,
            updated_at: img.updatedAt ? new Date(img.updatedAt) : undefined,
          }))
        : [],
      features: rc.features
        ? rc.features.map((feature: any) => ({
            id: feature.id || feature._id,
            room_class_id: feature.room_class_id || "",
            feature_id: feature.feature_id
              ? {
                  id: feature.feature_id.id || feature.feature_id._id,
                  name: feature.feature_id.name,
                  icon: feature.feature_id.icon || "",
                  description: feature.feature_id.description || "",
                  image: feature.feature_id.image || "",
                }
              : undefined,
          }))
        : [],
      reviews: rc.reviews
        ? rc.reviews.map((review: any) => ({
            id: review.id || review._id,
            rating: review.rating || 0,
            comment: review.comment || "",
            user: review.user || {},
            created_at: review.createdAt
              ? new Date(review.createdAt)
              : undefined,
            updated_at: review.updatedAt
              ? new Date(review.updatedAt)
              : undefined,
          }))
        : [],
      comments: rc.comments
        ? rc.comments.map((comment: any) => ({
            id: comment.id || comment._id,

            content: comment.content || "",
            user: comment.user || {},
            created_at: comment.createdAt
              ? new Date(comment.createdAt)
              : undefined,
            updated_at: comment.updatedAt
              ? new Date(comment.updatedAt)
              : undefined,
          }))
        : [],
    }));

    return {
      success: true,
      message: response.message || "Room classes fetched successfully",
      data: roomClasses,
    };
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data ||
      "An error occurred while fetching room classes";
    return {
      success: false,
      message,
      data: [],
    };
  }
};

export const fetchRoomClassById = async (
  id: string
): Promise<{
  success: boolean;
  message?: string;
  data: RoomClass;
}> => {
  try {
    const response = await getRoomClassByIdApi(id);
    const data = response.data;
    const roomClass: RoomClass = {
      id: data.id || data._id,
      main_room_class_id: data.main_room_class_id || "",
      name: data.name,
      bed_amount: data.bed_amount || 0,
      capacity: data.capacity || 0,
      price: data.price || 0,
      price_discount: data.price_discount || 0,
      view: data.view || "",
      description: data.description || "",
      status: data.status || false,
      created_at: data.createdAt ? new Date(data.createdAt) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined,
      main_room_class: data.main_room_class,
      images: data.images
        ? data.images.map((img: any) => ({
            id: img.id || img._id,
            url: img.url,
            target: img.target || "",
            created_at: img.createdAt ? new Date(img.createdAt) : undefined,
            updated_at: img.updatedAt ? new Date(img.updatedAt) : undefined,
          }))
        : [],
      features: data.features
        ? data.features.map((feature: any) => ({
            id: feature.id || feature._id,
            room_class_id: feature.room_class_id || "",
            feature_id: feature.feature_id
              ? {
                  id: feature.feature_id.id || feature.feature_id._id,
                  name: feature.feature_id.name,
                  icon: feature.feature_id.icon || "",
                  image: feature.feature_id.image || "",
                  description: feature.feature_id.description || "",
                }
              : undefined,
          }))
        : [],
      reviews: data.reviews
        ? data.reviews.map((review: Review) => ({
            id: review.id,
            room_class_id: review.room_class_id || "",
            parent_id: review.parent_id || null,
            employee_id: review.employee_id || null,
            user_id: review.user_id || null,
            rating: review.rating || null,
            content: review.content || "",
            status: review.status || false,
            created_at: review.created_at
              ? new Date(review.created_at)
              : undefined,
            updated_at: review.updated_at
              ? new Date(review.updated_at)
              : undefined,
          }))
        : [],
      comments: data.comments
        ? data.comments.map((comment: any) => ({
            id: comment.id || comment._id,
            room_class_id: comment.room_class_id || "",
            parent_id: comment.parent_id || null,
            employee_id: comment.employee_id || null,
            user_id: comment.user_id || {},
            content: comment.content || "",
            status: comment.status || false,
            created_at: comment.createdAt
              ? new Date(comment.createdAt)
              : undefined,
            updated_at: comment.updatedAt
              ? new Date(comment.updatedAt)
              : undefined,
          }))
        : [],
    };
    return {
      success: true,
      message: response.message || "Room class fetched successfully",
      data: roomClass,
    };
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data ||
      "An error occurred while fetching the room class";
    return {
      success: false,
      message,
      data: {} as RoomClass, // Return an empty RoomClass object on error
    };
  }
};
