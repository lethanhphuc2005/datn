const router = require("express").Router();
const serviceCon = require("../controllers/serviceCon");
const middlewareCon = require("../middlewares/middlewareCon");

// === LẤY DANH SÁCH DỊCH VỤ ===
router.get(
  "/",
  middlewareCon.authorizeRoles("admin", "receptionist"),
  serviceCon.getAllServices
);

// === LẤY DANH SÁCH DỊCH VỤ CHO USER ===
router.get("/user", serviceCon.getAllServicesForUser);

// === LẤY DỊCH VỤ THEO ID ===
router.get("/:id", serviceCon.getServiceById);

// === THÊM DỊCH VỤ ===
router.post("/", middlewareCon.authorizeRoles("admin"), serviceCon.addService);

// === CẬP NHẬT DỊCH VỤ ===
router.put(
  "/:id",
  middlewareCon.authorizeRoles("admin"),
  serviceCon.updateService
);

// === KÍCH HOẠT/ VÔ HIỆU HOÁ DỊCH VỤ ===
router.put(
  "/toggle/:id",
  middlewareCon.authorizeRoles("admin"),
  serviceCon.toggleServiceStatus
);

// // === XÓA DỊCH VỤ ===
// router.delete(
//   "/:id",
//   middlewareCon.authorizeRoles("admin"),
//   serviceCon.deleteService
// );

module.exports = router;
