const router = require("express").Router();

const paymentMethodController = require("../controllers/paymentMethod.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// === LẤY TẤT CẢ PHƯƠNG THỨC THANH TOÁN ===
router.get(
  "/",
  // authMiddleware.authorizeRoles("admin", "receptionist"),
  paymentMethodController.getAllPaymentMethods
);

// === LẤY PHƯƠNG THỨC THANH TOÁN THEO ID ===
router.get(
  "/:id",
  authMiddleware.authorizeRoles("admin", "receptionist"),
  paymentMethodController.getPaymentMethodById
);

// === THÊM PHƯƠNG THỨC THANH TOÁN ===
router.post(
  "/",
  authMiddleware.authorizeRoles("admin"),
  paymentMethodController.addPaymentMethod
);

// === CẬP NHẬT PHƯƠNG THỨC THANH TOÁN ===
router.patch(
  "/:id",
  authMiddleware.authorizeRoles("admin"),
  paymentMethodController.updatePaymentMethod
);

// === KÍCH HOẠT/ VÔ HIỆU HÓA PHƯƠNG THỨC THANH TOÁN ===
router.patch(
  "/toggle/:id",
  authMiddleware.authorizeRoles("admin"),
  paymentMethodController.togglePaymentMethodStatus
);

// === XÓA PHƯƠNG THỨC THANH TOÁN ===
router.delete(
  "/:id",
  authMiddleware.authorizeRoles("admin"),
  paymentMethodController.deletePaymentMethod
);

module.exports = router;
