const User = require("../models/user.model");
const Employee = require("../models/employee.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mailSender = require("../helpers/mail.sender");
const { verificationEmail } = require("../config/mail");
const { upload } = require("../middlewares/upload.middleware");

let refreshTokens = [];
const accountController = {
  // === TẠO TOKEN VÀ REFRESH TOKEN ===
  creareToken: (user) => {
    return jwt.sign(
      {
        id: user._id || user.id,
        role: user.role || "user",
        level: user.level || "user",
      },
      process.env.ACCESS_TOKEN,
      { expiresIn: "15m" }
    );
  },
  creareRefreshToken: (user) => {
    return jwt.sign(
      {
        id: user._id || user.id,
        role: user.role || "user",
        level: user.level || "user",
      },
      process.env.REFRESH_TOKEN,
      { expiresIn: "20d" }
    );
  },

  // ====== KIỂM TRA CÁC ĐIỀU KIỆN USER =====
  validateUser: async (userData, userId) => {
    const { email, password, first_name, last_name, phone_number, address } =
      userData;

    // Kiểm tra các trường bắt buộc
    if (!email || !password || !phone_number) {
      return {
        valid: false,
        message: "Vui lòng điền đầy đủ thông tin người dùng.",
      };
    }

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, message: "Email không hợp lệ." };
    }

    // Kiểm tra độ dài chuỗi
    if (
      first_name.length > 100 ||
      last_name.length > 100 ||
      address.length > 255
    ) {
      return { valid: false, message: "Tên hoặc địa chỉ quá dài." };
    }

    // Kiểm tra trùng email
    const existing = await User.findOne({ email });
    if (
      existing &&
      (!userId || existing._id.toString() !== userId.toString())
    ) {
      return { valid: false, message: "Email đã tồn tại." };
    }

    // Kiểm tra số điện thoại
    const phoneRegex = /^\d{10}$/; // Giả sử số điện thoại có 10 chữ số
    if (!phoneRegex.test(phone_number)) {
      return { valid: false, message: "Số điện thoại không hợp lệ." };
    }

    return { valid: true };
  },

  // ====== THÊM TÀI KHOẢN USER =====
  addUserAccount: async (req, res) => {
    try {
      const checkAccount = new User(req.body);
      const validation = await accountController.validateUser(checkAccount);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }

      // 1. Tạo mã xác nhận 6 chữ số
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      // 2. Gửi mã xác nhận qua email
      try {
        mailSender({
          email: req.body.email,
          subject: verificationEmail.subject,
          html: verificationEmail.html(verificationCode),
        });
      } catch (mailError) {
        return res.status(500).json({
          message: "Gửi mã xác nhận thất bại",
          error: mailError.message,
        });
      }

      // Mã hoá mật khẩu bằng bcrypt
      const hashPassword = await bcrypt.hash(req.body.password, 10);
      // Tạo một instance mới của userModel
      const newAccountToSave = new User({
        email: req.body.email,
        password: hashPassword,
        first_name: req.body.first_name,
        phone_number: req.body.phone_number,
        address: req.body.address,
        last_name: req.body.last_name,
        request: req.body.request,
        status: true, // mặc định là true hoặc bạn xử lý theo logic riêng
        verification_code: verificationCode, // lưu để đối chiếu sau
        is_verified: false,
      });
      // Lưu vào database bằng hàm save()
      const savedAccount = await newAccountToSave.save();
      const { password, verification_code, ...accountData } = savedAccount._doc;
      res.status(200).json({
        message: "Tạo tài khoản thành công",
        data: accountData,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  },

  // ====== THÊM TÀI KHOẢN QUẢN TRỊ VIÊN =====
  addAuthAccount: [
    upload.none(),
    async (req, res) => {
      try {
        if (req.body.secret_key !== process.env.ADMIN_SECRET_KEY) {
          return res.status(403).json("Bạn không có quyền tạo admin");
        }

        const checkAccount = await Employee.findOne({
          email: req.body.email,
        });
        if (checkAccount) {
          return res.status(400).json("Email admin đã tồn tại");
        }

        const hashPassword = await bcrypt.hash(req.body.password, 10);
        const newAccount = new Employee({
          email: req.body.email,
          password: hashPassword,
          first_name: req.body.first_name,
          last_name: req.body.last_name,
          phone_number: req.body.phone_number,
          address: req.body.address,
          position: req.body.position,
          department: req.body.department,
          role: req.body.role,
          status: true,
        });
        const savedAccount = await newAccount.save();
        res.status(200).json({
          message: "Tạo tài khoản admin thành công",
          data: savedAccount,
        });
      } catch (error) {
        res.status(500).json(error.message);
      }
    },
  ],

  // ====== ĐĂNG NHẬP USER =====
  loginUser: async (req, res) => {
    try {
      const checkUser = await User.findOne({ email: req.body.email });
      if (!checkUser) return res.status(400).json("Email không tồn tại");

      if (!checkUser.status) {
        return res
          .status(403)
          .json("Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt");
      }

      const isMatch = await bcrypt.compare(
        req.body.password,
        checkUser.password
      );
      if (!isMatch) return res.status(400).json("Sai mật khẩu");
      // Kiểm tra xem tài khoản đã được xác minh chưa
      if (!checkUser.is_verified) {
        return res
          .status(403)
          .json(
            "Tài khoản chưa được xác minh. Vui lòng kiểm tra email để xác minh tài khoản."
          );
      }
      if (checkUser && isMatch) {
        const accessToken = accountController.creareToken(checkUser);
        const refreshToken = accountController.creareRefreshToken(checkUser);

        const { address, createdAt, updatedAt, ...userJson } =
          checkUser.toJSON(); // toJSON đã xử lý sẵn
        res.status(200).json({
          message: "Đăng nhập thành công",
          data: {
            ...userJson,
            accessToken,
            refreshToken,
          },
        });
      }
    } catch (error) {
      res.status(500).json(error);
    }
  },

  // ====== ĐĂNG NHẬP QUẢN TRỊ VIÊN =====
  loginAuth: async (req, res) => {
    try {
      const admin = await Employee.findOne({ email: req.body.email });
      if (!admin) return res.status(400).json("Admin không tồn tại");

      if (!admin.status) {
        return res
          .status(403)
          .json("Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt");
      }

      const isMatch = await bcrypt.compare(req.body.password, admin.password);
      if (!isMatch) return res.status(400).json("Sai mật khẩu");
      const accessToken = accountController.creareToken(admin);
      const refreshToken = accountController.creareRefreshToken(admin);
      const dataToSend = {
        id: admin._id,
        first_name: admin.first_name,
        last_name: admin.last_name,
        position: admin.position,
        department: admin.department,
        email: admin.email,
        phone_number: admin.phone_number,
        status: admin.status,
        role: admin.role,
      };

      res.status(200).json({
        message: "Đăng nhập thành công",
        data: { ...dataToSend, accessToken, refreshToken },
      });
    } catch (err) {
      res.status(500).json(err.message);
    }
  },

  // ====== LẤY TOKEN MỚI =====
  requestRefreshToken: async (req, res) => {
    // Kiểm tra xem refreshToken có trong body không
    let { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json("Không có token");

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, user) => {
      if (err) {
        return res.status(403).json("Lỗi xác thực token");
      }

      // Tạo accessToken và refreshToken mới
      const newAccessToken = accountController.creareToken(user);
      const newRefreshToken = accountController.creareRefreshToken(user);

      res.status(200).json({
        message: "Cấp token mới thành công",
        data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
      });
    });
  },

  // ====== ĐĂNG XUẤT =====
  logout: async (req, res) => {
    res.user = null; // Xoá thông tin người dùng khỏi request
    res.status(200).json("Đăng xuất thành công");
  },
};
module.exports = accountController;
