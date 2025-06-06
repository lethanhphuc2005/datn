const router = require("express").Router();
const roomCon = require("../controllers/roomCon");
const middlewareCon = require("../middlewares/middlewareCon");

// === LẤY DANH SÁCH PHÒNG ===
router.get(
  "/",
  middlewareCon.authorizeRoles("admin", "receptionist"),
  roomCon.getAllRooms
);

// === LẤY PHÒNG THEO ID ===
router.get(
  "/:id",
  middlewareCon.authorizeRoles("admin", "receptionist"),
  roomCon.getRoomById
);

// === THÊM PHÒNG ===
router.post("/", middlewareCon.authorizeRoles("admin"), roomCon.addRoom);

// === CẬP NHẬT THÔNG TIN PHÒNG ===
router.put(
  "/:id",
  middlewareCon.authorizeRoles("admin", "receptionist"),
  roomCon.updateRoom
);

// === KÍCH HOẠT/ VÔ HIỆU HOÁ PHÒNG ===
router.put(
  "/toggle/:id",
  middlewareCon.authorizeRoles("admin", "receptionist"),
  roomCon.toggleRoomStatus
);

// // === XÓA PHÒNG ===
// router.delete(
//   "/:id",
//   middlewareCon.authorizeRoles("admin"),
//   roomCon.deleteRoom
// );

module.exports = router;
