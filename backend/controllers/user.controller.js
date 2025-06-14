const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const accountController = require("./account.controller");
const mailSender = require("../helpers/mail.sender");
const { verificationEmail, forgotPasswordEmail } = require("../config/mail"); // Import email template

const userController = {
  // ====== LẤY TẤT CẢ USER (có phân trang, sắp xếp, lọc trạng thái) =====
  getAllUsers: async (req, res) => {
    try {
      const {
        search = "",
        page = 1,
        limit = 10,
        sort = "createdAt",
        order = "desc",
        status,
      } = req.query;

      const query = {};
      // Tạo bộ lọc tìm kiếm
      if (search) {
        query.$or = [
          { first_name: { $regex: search, $options: "i" } },
          { last_name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone_number: { $regex: search, $options: "i" } },
          { address: { $regex: search, $options: "i" } },
          { request: { $regex: search, $options: "i" } },
        ];
      }

      if (typeof status !== "undefined") {
        // Chấp nhận cả true/false dạng string
        if (status === "true" || status === true) {
          query.status = true;
        } else if (status === "false" || status === false) {
          query.status = false;
        }
      }

      const sortOption = {};
      sortOption[sort] = order === "asc" ? 1 : -1;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const users = await User.find(query)
        .populate([
          {
            path: "comments",
          },
          {
            path: "reviews",
          },
          {
            path: "bookings",
          },
        ])
        .sort(sortOption)
        .select("-password") // Loại bỏ trường password và __v
        .skip(skip)
        .limit(parseInt(limit))
        .exec();

      const total = await User.countDocuments(query);

      if (!users || users.length === 0) {
        return res.status(404).json("Không tìm thấy user nào");
      }
      res.status(200).json({
        message: "Lấy tất cả user thành công",
        data: users,
        pagination: {
          total: total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      res.status(500).json(error);
    }
  },

  // ==== LẤY USER THEO ID ====
  getUserById: async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select("-password");
      if (!user) {
        return res.status(404).json("Không tìm thấy user");
      }
      // Chỉ trả về các trường cần thiết, tránh lộ thông tin nhạy cảm
      res.status(200).json({
        message: "Lấy user thành công",
        data: user,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  },

  // === ĐỔI MẬT KHẨU ===
  changePassword: async (req, res) => {
    try {
      const userId = req.params.id;
      const { password, newPassword } = req.body;

      if (!password || !newPassword) {
        return res
          .status(400)
          .json({ message: "Mật khẩu không được để trống" });
      }
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy user" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ message: "Mật khẩu hiện tại không đúng" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await user.updateOne({ $set: { password: hashedPassword } });

      res.status(200).json({
        message: "Đổi mật khẩu thành công",
        data: { userId: user._id },
      });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Đổi mật khẩu không thành công", error: err });
    }
  },

  // === CẬP NHẬT USER ===
  updateUser: async (req, res) => {
    try {
      const userToUpdate = await User.findById(req.params.id);
      if (!userToUpdate) {
        return res.status(404).json({ message: "Không tìm thấy user" });
      }

      // Không cho phép cập nhật trường status qua API này
      if ("status" in req.body) {
        return res
          .status(400)
          .json({ message: "Không được cập nhật trường status" });
      }

      // Nếu không có trường nào được gửi, dùng lại toàn bộ dữ liệu cũ
      const updatedData =
        Object.keys(req.body).length === 0
          ? userToUpdate.toObject()
          : { ...userToUpdate.toObject(), ...req.body };

      // Validate dữ liệu cập nhật (dùng validateUser bạn đã tạo)
      const validation = await accountController.validateUser(
        updatedData,
        req.params.id
      );

      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }

      await userToUpdate.updateOne({ $set: req.body });
      res.status(200).json({
        message: "Cập nhật user thành công",
        data: updatedData,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  },

  // === KÍCH HOẠT/ VÔ HIỆU HOÁ USER ===
  toggleUserStatus: async (req, res) => {
    try {
      const userToToggle = await User.findById(req.params.id);
      if (!userToToggle) {
        return res.status(404).json({ message: "Không tìm thấy user" });
      }

      // Lưu trạng thái mới
      userToToggle.status = !userToToggle.status;
      await userToToggle.save();

      res.status(200).json({
        message: `User đã ${
          userToToggle.status ? "kích hoạt" : "vô hiệu hóa"
        } thành công`,
        data: userToToggle,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // === XOÁ USER ===
  deleteUser: async (req, res) => {
    try {
      const userToDelete = await User.findById(req.params.id);
      if (!userToDelete) {
        return res.status(404).json("Không tìm thấy user để xóa");
      } else if (userToDelete.status === true) {
        return res.status(400).json("Không thể xóa user đang hoạt động");
      } else if (userToDelete.status === false) {
        return res.status(400).json("User đã bị xóa trước đó");
      }
      await User.findByIdAndDelete(req.params.id);

      res.status(200).json({
        message: "Xóa user thành công ",
        data: { userId: user._id },
      });
    } catch (error) {
      res.status(500).json(error);
    }
  },

  // === XÁC THỰC MÃ XÁC NHẬN TÀI KHOẢN ===
  verifyUser: async (req, res) => {
    try {
      const { email, verificationCode } = req.body;

      if (!email || !verificationCode) {
        return res.status(400).json("Email và mã xác nhận không được để trống");
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json("Không tìm thấy tài khoản với email này");
      }

      if (user.is_verified) {
        return res.status(400).json("Tài khoản đã được xác minh trước đó");
      }

      if (user.verification_code !== verificationCode) {
        return res.status(400).json("Mã xác nhận không chính xác");
      }

      user.is_verified = true;
      user.verification_code = null; // Xoá mã xác nhận sau khi xác thực
      await user.save();

      res.status(200).json({
        message: "Xác thực tài khoản thành công",
        data: { userId: user._id },
      });
    } catch (error) {
      res.status(500).json(error);
    }
  },

  resendEmailVerification: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json("Email không được để trống");
      }

      const user = await User.find({ email });
      if (!user || user.length === 0) {
        return res.status(404).json("Không tìm thấy tài khoản với email này");
      }
      if (user.is_verified) {
        return res.status(400).json("Tài khoản đã được xác minh trước đó");
      }
      // Tạo mã xác nhận mới và gửi qua email
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      user.verification_code = verificationCode;
      await user.save();
      // Gửi mã xác nhận qua email (giả sử bạn đã có hàm gửi email)
      try {
        await mailSender({
          email: user.email,
          subject: verificationEmail.subject,
          html: verificationEmail.html(verificationCode),
        });
      } catch (error) {
        return res.status(500).json({
          message: "Gửi mã xác nhận thất bại",
          error: error.message,
        });
      }
      res.status(200).json({
        message: "Mã xác nhận đã được gửi đến email của bạn",
        data: { userId: user._id },
      });
    } catch (error) {
      res.status(500).json(error);
    }
  },

  // === QUÊN MẬT KHẨU ===
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json("Email không được để trống");
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json("Không tìm thấy tài khoản với email này");
      }

      // Tạo mã xác nhận mới và gửi qua email
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      user.verification_code = verificationCode;
      await user.save();

      // Gửi mã xác nhận qua email (giả sử bạn đã có hàm gửi email)
      try {
        await mailSender({
          email: user.email,
          subject: forgotPasswordEmail.subject,
          html: forgotPasswordEmail.html(verificationCode),
        });
      } catch (error) {
        return res.status(500).json({
          message: "Gửi mã xác nhận thất bại",
          error: error.message,
        });
      }

      res.status(200).json({
        message: "Mã xác nhận đã được gửi đến email của bạn",
        data: { userId: user._id },
      });
    } catch (error) {
      res.status(500).json(error);
    }
  },

  // === ĐẶT LẠI MẬT KHẨU ===
  resetPassword: async (req, res) => {
    try {
      const { email, verificationCode, newPassword } = req.body;

      if (!email || !verificationCode || !newPassword) {
        return res.status(400).json("Các trường không được để trống");
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json("Không tìm thấy tài khoản với email này");
      }

      if (user.verification_code !== verificationCode) {
        return res.status(400).json("Mã xác nhận không chính xác");
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.verification_code = null; // Xoá mã xác nhận sau khi đặt lại mật khẩu
      await user.save();

      res.status(200).json({
        message: "Đặt lại mật khẩu thành công",
        data: { userId: user._id },
      });
    } catch (error) {
      console.error("Lỗi khi reset password:", error);

      res.status(500).json(error);
    }
  },
};

module.exports = userController;
