const PaymentFactory = require("../utils/paymentFactory.js");
const VNPAYService = require("../services/payments/vnpay.service");

const { VNPayConfig } = require("../config/payment");

const Booking = require("../models/booking.model");
const Payment = require("../models/payment.model");
const PaymentMethod = require("../models/paymentMethod.model");
const walletController = require("./wallet.controller");
const User = require("../models/user.model");
const userController = require("./user.controller");
const { isValidObjectId } = require("mongoose");
const mongoose = require("mongoose");

const PaymentController = {
  // === TẠO YÊU CẦU THANH TOÁN ===
  createPayment: async (req, res) => {
    try {
      const { method } = req.params;
      if (!method) {
        return res.status(400).json("Payment method is required");
      }

      if (method === "cash") {
        // Handle cash payment creation
        const { orderId } = req.body;
        if (!orderId) {
          return res.status(400).json("OrderId is required for cash payment");
        }

        const paymentMethod = await PaymentMethod.findOne({
          name: { $regex: /cash/i },
        });

        const booking = await Booking.findById(orderId);
        if (!booking) {
          return res.status(404).json("Booking not found");
        }
        if (booking.payment_status === "PAID") {
          return res.status(400).json("Booking has already been paid");
        } else if (booking.payment_status === "CANCELED") {
          return res.status(400).json("Booking has been canceled");
        }

        await booking.save();

        // Create a cash payment record
        const payment = new Payment({
          booking_id: orderId,
          amount: booking.total_price,
          payment_method_id: paymentMethod._id,
          status: "pending",
          transaction_id: `cash-${orderId}-${Date.now()}`,
          payment_date: new Date(),
        });

        await payment.save();

        return res.status(200).json({
          success: true,
          message: "Cash payment created successfully",
          data: { orderId, method: "cash" },
        });
      }
      if (method === "wallet") {
        // Handle wallet payment creation
        const { orderId } = req.body;
        if (!orderId) {
          return res.status(400).json("OrderId is required for wallet payment");
        }

        const paymentMethod = await PaymentMethod.findOne({
          name: { $regex: /wallet/i },
        });

        const booking = await Booking.findById(orderId);
        if (!booking) {
          return res.status(404).json("Booking not found");
        }
        if (booking.payment_status === "PAID") {
          return res.status(400).json("Booking has already been paid");
        } else if (booking.payment_status === "CANCELED") {
          return res.status(400).json("Booking has been canceled");
        }

        // Create a wallet payment record
        const userId = booking.user_id;
        const amount = booking.total_price;
        const wallet = await walletController.useInternal(
          userId,
          amount,
          `Thanh toán booking ${orderId} bằng ví`
        );

        // Check if wallet payment was successful
        if (wallet.error) {
          return res.status(401).json({
            message: wallet.message || "Failed to use wallet",
          });
        }

        // Update booking payment status
        booking.payment_status = "PAID";
        await booking.save();

        const payment = new Payment({
          booking_id: orderId,
          amount: booking.total_price,
          payment_method_id: paymentMethod._id,
          status: "completed",
          transaction_id: `wallet-${orderId}-${Date.now()}`,
          payment_date: new Date(),
        });
        await payment.save();

        if (booking.user_id) {
          const user = await User.findById(booking.user_id);
          if (!user) throw new Error("User not found");

          user.total_spent += Number(amount);
          user.total_bookings += 1;
          const nights = booking.check_out_date
            ? Math.ceil(
                (new Date(booking.check_out_date) -
                  new Date(booking.check_in_date)) /
                  (1000 * 60 * 60 * 24)
              )
            : 1;
          user.total_nights += nights;

          await user.save();
          await userController.handleUpdateLevel(booking.user_id);
        }

        return res.status(200).json({
          success: true,
          message: "Wallet payment created successfully",
          data: { orderId, method: "wallet" },
        });
      }

      const paymentService = PaymentFactory.handlePaymentMethodService(method);
      const response = await paymentService.handleCreatePayment(req);

      return res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error("Payment error:", error.message);
      return res.status(500).json({
        error: error.message || "Failed to process payment callback",
        code: error.code || "INTERNAL_SERVER_ERROR",
      });
    }
  },

  // === XỬ LÝ IPN TỪ CÁC CỔNG THANH TOÁN ===
  checkIpn: async (req, res) => {
    try {
      const { method } = req.params;
      if (!method) {
        return res.status(400).json({
          error: "Payment method is required",
        });
      }

      const paymentService = PaymentFactory.handlePaymentMethodService(method);
      const response = await paymentService.handleCallBack(req);
      if (!response) {
        return res.status(400).json({
          error: "Failed to process payment callback",
        });
      }

      return res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error("Payment callback error:", error.message);
      return res.status(error.status || 500).json({
        error: error.message || "Failed to process payment callback",
        code: error.code || "INTERNAL_SERVER_ERROR",
      });
    }
  },

  // === LẤY TRẠNG THÁI GIAO DỊCH ===
  getTransactionStatus: async (req, res) => {
    try {
      const { method } = req.params;
      if (!method) {
        return res.status(400).json({
          error: "Payment method is required",
        });
      }
      const { orderId } = req.query;
      if (!orderId) {
        return res.status(400).json({
          error: "Order ID is required",
        });
      }

      const paymentService = PaymentFactory.handlePaymentMethodService(method);
      const status = await paymentService.handleGetTransactionStatus(req);

      return res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      console.error("Get transaction status error:", error.message);
      return res.status(500).json({
        error: error.message || "Failed to get transaction status",
        code: error.code || "INTERNAL_SERVER_ERROR",
      });
    }
  },

  // === TRẢ VỀ CALLBACK URL CHO VNPAY ===
  checkIpnVNPay: async (req, res) => {
    try {
      const result = VNPAYService.verifyReturnUrl(req.query);

      if (!result.isVerified) {
        return res.send("Chữ ký không hợp lệ!");
      }

      if (!result.isSuccess) {
        return res.send("Giao dịch không thành công!");
      }

      // ✅ Gọi IPN xử lý tự động ở đây
      const ipnResult = await VNPAYService.handleIPN(req.query);

      if (!ipnResult.success) {
        return res.send(`Xử lý IPN thất bại: ${ipnResult.message}`);
      }

      // ✅ Giao dịch thành công + xử lý IPN thành công
      // Có thể redirect sang frontend
      return res.redirect(
        `${VNPayConfig.returnUrl}?orderId=${req.query.vnp_TxnRef}`
      );
    } catch (error) {
      return res.status(500).send({
        error: error.message || "Lỗi khi xử lý IPN VNPay",
        code: error.code || "INTERNAL_SERVER_ERROR",
      });
    }
  },

  // === LẤY DANH SÁCH ĐƠN THANH TOÁN ===
  getAllPayments: async (req, res) => {
    try {
      const {
        search = "",
        page = 1,
        limit,
        sort = "createdAt",
        order = "desc",
        method,
        status,
        payment_date,
      } = req.query;

      const query = {};

      if (search) {
        const orConditions = [
          { transaction_id: { $regex: search, $options: "i" } },
        ];

        // nếu search là chuỗi 24 ký tự hợp lệ, thử convert sang ObjectId
        if (isValidObjectId(search)) {
          orConditions.push({
            booking_id: new mongoose.Types.ObjectId(search),
          });
        }

        query.$or = orConditions;
      }

      const sortOption = {};
      if (sort === "status") {
        sortOption.status = order === "asc" ? 1 : -1;
      } else {
        sortOption[sort] = order === "asc" ? 1 : -1;
      }

      if (method) {
        query.payment_method_id = method;
      }

      if (status) {
        query.status = status;
      }

      if (payment_date) {
        const date = new Date(payment_date);
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));
        query.payment_date = {
          $gte: startOfDay,
          $lte: endOfDay,
        };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [payments, total] = await Promise.all([
        Payment.find(query)
          .populate("booking payment_method")
          .sort(sortOption)
          .skip(skip)
          .limit(parseInt(limit))
          .exec(),
        Payment.countDocuments(query),
      ]);

      if (!payments || payments.length === 0) {
        return res.status(404).json({ message: "Không có giao dịch nào" });
      }

      return res.status(200).json({
        message: "Payments retrieved successfully",
        data: payments,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Get all payments error:", error.message);
      return res.status(500).json({
        error: error.message || "Failed to get all payments",
        code: error.code || "INTERNAL_SERVER_ERROR",
      });
    }
  },
};

module.exports = PaymentController;
