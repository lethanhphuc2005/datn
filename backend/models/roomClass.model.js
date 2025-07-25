const mongoose = require("mongoose");

const RoomClassSchema = new mongoose.Schema(
  {
    main_room_class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "main_room_class",
      required: true,
    },
    name: {
      type: String,
      required: true,
      default: "",
      trim: true,
      maxlength: 100,
    },
    bed_amount: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    capacity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    price_discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    view: {
      type: String,
      enum: ["biển", "thành phố", "núi", "vườn", "hồ bơi", "sông", "hồ"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    status: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  { timestamps: true }
);

RoomClassSchema.virtual("main_room_class", {
  ref: "main_room_class",
  localField: "main_room_class_id",
  foreignField: "_id",
  justOne: true,
  options: {
    select: "name description status createdAt updatedAt",
  },
});

RoomClassSchema.virtual("rooms", {
  ref: "room",
  localField: "_id",
  foreignField: "room_class_id",
  justOne: false,
  options: {
    select: "name floor room_status_id",
  },
});

RoomClassSchema.virtual("features", {
  ref: "room_class_feature",
  localField: "_id",
  foreignField: "room_class_id",
  justOne: false,
  options: {
    select: "feature_id status createdAt updatedAt",
    populate: {
      path: "feature",
      model: "feature",
    },
  }
});

RoomClassSchema.virtual("images", {
  ref: "image",
  localField: "_id",
  foreignField: "room_class_id",
  match: [
    { status: true }, // Chỉ lấy ảnh hợp lệ
    { type: "room_class" }, // Chỉ lấy ảnh loại phòng
  ],

  justOne: false,
  options: {
    select: "url target status createdAt updatedAt",
  },
});

RoomClassSchema.virtual("reviews", {
  ref: "review",
  localField: "_id",
  foreignField: "room_class_id",
  justOne: false,
});

RoomClassSchema.virtual("comments", {
  ref: "comment",
  localField: "_id",
  foreignField: "room_class_id",
});

RoomClassSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

const RoomClass = mongoose.model("room_class", RoomClassSchema, "room_class");

module.exports = RoomClass;
