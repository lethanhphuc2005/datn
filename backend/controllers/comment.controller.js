const Comment = require("../models/comment.model");
const RoomClass = require("../models/roomClass.model");
const Employee = require("../models/employee.model");
const User = require("../models/user.model");

const commentController = {
  // === KIỂM TRA ĐIỀU KIỆN BÌNH LUẬN ===
  validateComment: async (commentData, commentId) => {
    const { room_class_id, content, employee_id, user_id, parent_id } =
      commentData;

    // Kiểm tra xem room_class_id có tồn tại không
    const roomClass = await RoomClass.findById(room_class_id);
    if (!roomClass) {
      return { valid: false, message: "Loại phòng không hợp lệ." };
    }

    // Kiểm tra xem employee_id có tồn tại không
    if (employee_id) {
      const employee = await Employee.findById(employee_id);
      if (!employee) {
        return { valid: false, message: "Nhân viên không hợp lệ." };
      }
    }

    // Kiểm tra xem user_id có tồn tại không
    if (user_id) {
      const user = await User.findById(user_id);
      if (!user) {
        return { valid: false, message: "Người dùng không hợp lệ." };
      }
    }

    // Kiểm tra xem parent_id có hợp lệ không (nếu có)
    if (parent_id) {
      const parentComment = await Comment.findById(parent_id);
      if (!parentComment) {
        return { valid: false, message: "Bình luận cha không hợp lệ." };
      }
    } else {
      // Nếu không có parent_id, đảm bảo rằng bình luận này không phải là một bình luận con
      const existingComment = await Comment.findOne({
        _id: commentId,
        parent_id: { $ne: null },
      });
      if (existingComment) {
        return {
          valid: false,
          message: "Bình luận này không thể là bình luận con.",
        };
      }
    }

    // Kiểm tra xem employee_id và user_id có cùng tồn tại không
    if (employee_id && user_id) {
      return {
        valid: false,
        message:
          "Không thể có cả employee_id và user_id trong cùng một bình luận.",
      };
    }

    // Kiểm tra xem employee_id hoặc user_id có tồn tại không
    if (!employee_id && !user_id) {
      return {
        valid: false,
        message:
          "Phải có ít nhất một trong hai trường employee_id hoặc user_id.",
      };
    }

    // Kiểm tra xem nội dung bình luận có hợp lệ không
    if (!content || content.trim() === "") {
      return {
        valid: false,
        message: "Nội dung bình luận không được để trống.",
      };
    }

    return { valid: true };
  },

  // === LẤY DANH SÁCH BÌNH LUẬN ===
  getAllComments: async (req, res) => {
    try {
      const {
        search = "",
        page = 1,
        limit,
        sort,
        order,
        status,
        room_class,
      } = req.query;

      const query = {};
      if (search) {
        query.content = { $regex: search, $options: "i" };
      }

      if (status) {
        query.status = status;
      }

      if (room_class) {
        query.room_class_id = room_class;
      }

      const sortOptions = {};
      if (sort === "status") {
        sortOptions.status = order === "asc" ? 1 : -1;
      } else {
        sortOptions[sort] = order === "asc" ? 1 : -1;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [comments, total] = await Promise.all([
        Comment.find(query)
          .populate([
            {
              path: "room_class",
              populate: {
                path: "images",
                match: { status: true }, // Chỉ lấy ảnh hợp lệ
              },
            },
            { path: "employee" },
            { path: "user" },
          ])
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit))
          .exec(),
        Comment.countDocuments(query),
      ]);

      if (!comments || comments.length === 0) {
        return res.status(404).json({ message: "Không có bình luận nào." });
      }
      // Trả về danh sách bình luận
      return res.status(200).json({
        message: "Lấy danh sách bình luận thành công.",
        data: comments,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Lỗi khi lấy danh sách bình luận." });
    }
  },

  /// === LẤY DANH SÁCH BÌNH LUẬN CHO USER ===
  getAllCommentsForUser: async (req, res) => {
    try {
      const {
        search = "",
        page = 1,
        limit,
        sort,
        order,
        room_class,
      } = req.query;

      const query = { status: true };
      if (search) {
        query.content = { $regex: search, $options: "i" };
      }

      if (room_class) {
        query.room_class_id = room_class;
      }

      const sortOptions = {};
      sortOptions[sort] = order === "asc" ? 1 : -1;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [comments, total] = await Promise.all([
        Comment.find(query)
          .select("-status")
          .populate([
            {
              path: "room_class",
              populate: {
                path: "images",
                match: { status: true }, // Chỉ lấy ảnh hợp lệ
              },
            },
            { path: "employee" },
            { path: "user" },
          ])
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit))
          .exec(),
        Comment.countDocuments(query),
      ]);

      if (!comments || comments.length === 0) {
        return res.status(404).json({ message: "Không có bình luận nào." });
      }
      // Trả về danh sách bình luận
      return res.status(200).json({
        message: "Lấy danh sách bình luận thành công.",
        data: comments,
        pagination: {
          total: total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Lỗi khi lấy danh sách bình luận." });
    }
  },

  // === LẤY DANH SÁCH BÌNH LUẬN THEO ID ===
  getCommentById: async (req, res) => {
    try {
      const { id } = req.params;
      const comment = await Comment.findById(id)
        .populate("room_class", "-image -description")
        .populate("employee")
        .populate("user");

      // Trả về bình luận
      res.status(200).json({
        message: "Lấy bình luận thành công.",
        data: comment,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  },

  // === THÊM BÌNH LUẬN ===
  addComment: async (req, res) => {
    try {
      const newComment = new Comment(req.body);
      const validation = await commentController.validateComment(newComment);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }

      // Lưu bình luận vào cơ sở dữ liệu
      const savedComment = await newComment.save();
      const populatedComment = await savedComment.populate(
        "room_class employee user"
      );
      // Cập nhật thông tin người dùng hoặc nhân viên nếu có

      // Trả về bình luận đã lưu
      res.status(201).json({
        message: "Bình luận đã được thêm thành công.",
        data: populatedComment,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  },

  // === CẬP NHẬT BÌNH LUẬN (CHỈ ĐƯỢC CẬP NHẬT NỘI DUNG) ===
  updateComment: async (req, res) => {
    try {
      const { id } = req.params;
      const commentToUpdate = await Comment.findById(id);
      if (!commentToUpdate) {
        return res.status(404).json({ message: "Bình luận không tồn tại." });
      }

      // Chỉ cho phép cập nhật trường content
      const { content } = req.body;
      if (typeof content !== "string" || content.trim() === "") {
        return res
          .status(400)
          .json({ message: "Nội dung bình luận không được để trống." });
      }

      // Tạo dữ liệu mới chỉ với content
      const updatedData = { ...commentToUpdate.toObject(), content };

      const validation = await commentController.validateComment(
        updatedData,
        id
      );
      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }

      // Cập nhật chỉ trường content
      commentToUpdate.content = content;
      const updatedComment = await commentToUpdate.save();
      const populatedComment = await updatedComment.populate(
        "room_class employee user"
      );

      res.status(200).json({
        message: "Cập nhật bình luận thành công.",
        data: populatedComment,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  },

  // === XÓA BÌNH LUẬN ===
  deleteComment: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedComment = await Comment.findByIdAndDelete(id);
      if (!deletedComment) {
        return res.status(404).json({ message: "Bình luận không tồn tại." });
      }
      res.status(200).json({
        message: "Bình luận đã được xóa thành công.",
        data: deletedComment,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  },

  // === KÍCH HOẠT/VÔ HIỆU HÓA BÌNH LUẬN ===
  toggleCommentStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const comment = await Comment.findById(id);
      if (!comment) {
        return res.status(404).json({ message: "Bình luận không tồn tại." });
      }
      comment.status = !comment.status; // Đảo ngược trạng thái bình luận
      const updatedComment = await comment.save();
      res.status(200).json({
        message: `Bình luận đã được ${
          updatedComment.status ? "kích hoạt" : "vô hiệu hóa"
        } thành công.`,
        data: updatedComment,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Lỗi khi cập nhật trạng thái bình luận." });
    }
  },
};

module.exports = commentController;
