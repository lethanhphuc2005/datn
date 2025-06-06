const router = require("express").Router();
const commentCon = require("../controllers/commentCon");
const middlewareCon = require("../middlewares/middlewareCon");

// === LẤY DANH SÁCH BÌNH LUẬN ===
router.get(
  "/",
  middlewareCon.authorizeSelfOrRoles("admin"),
  commentCon.getAllComments
);

// === LẤY DANH SÁCH BÌNH LUẬN CHO USER ===
router.get("/user", commentCon.getAllCommentsForUser);

// === LẤY DANH SÁCH BÌNH LUẬN THEO ID ===
router.get(
  "/:id",
  middlewareCon.authorizeSelfOrRoles("admin"),
  commentCon.getCommentById
);

// === THÊM BÌNH LUẬN ===
router.post(
  "/",
  middlewareCon.authorizeSelfOrRoles("admin"),
  commentCon.addComment
);

// === CẬP NHẬT BÌNH LUẬN ===
router.put("/:id", middlewareCon.authorizeComment(), commentCon.updateComment);

// === XÓA BÌNH LUẬN ===
router.delete(
  "/:id",
  middlewareCon.authorizeComment(),
  commentCon.deleteComment
);

// === KÍCH HOẠT/ VÔ HIỆU HÓA BÌNH LUẬN ===
router.put(
  "/toggle/:id",
  middlewareCon.authorizeRoles("admin"),
  commentCon.toggleCommentStatus
);

module.exports = router;
