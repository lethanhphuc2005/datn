import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { formatDate } from "@/utils/dateUtils";
import Pagination from "@/components/sections/Pagination";
import { AnimatedButtonPrimary } from "@/components/common/Button";
import { showConfirmDialog, showTextareaInputDialog } from "@/utils/swal";
import {
  previewCancellationFee,
  cancelBooking,
} from "@/services/BookingService";
import { formatCurrencyVN } from "@/utils/currencyUtils";
import { useRouter } from "next/navigation";
import getImageUrl from "@/utils/getImageUrl";
import { Booking, BookingDetail } from "@/types/booking";
import { Payment } from "@/types/payment";
import { Discount } from "@/types/discount";
import { ServiceBooking } from "@/types/service";

export default function BookedRoomSection({
  bookings,
  setBookings,
}: {
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
}) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const totalItems = bookings.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = bookings.slice(startIndex, endIndex);
  const handlePageChange = ({ selected }: { selected: number }) => {
    setCurrentPage(selected + 1);
  };

  const [expandedId, setExpandedId] = useState<string | null>(null);
  if (!bookings || bookings.length === 0) {
    return (
      <div className="tw-text-center tw-text-gray-400">
        Bạn chưa đặt phòng nào.
      </div>
    );
  }
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getColorClass = (status: string) => {
    switch (status) {
      case "CHECKED_IN":
        return "tw-bg-green-500 tw-text-white";
      case "CHECKED_OUT":
        return "tw-bg-red-500 tw-text-white";
      case "CANCELLED":
        return "tw-bg-gray-500 tw-text-white";
      case "PENDING":
        return "tw-bg-amber-500 tw-text-black";
      case "CONFIRMED":
        return "tw-bg-blue-600 tw-text-white";
      default:
        return "tw-bg-yellow-400 tw-text-black";
    }
  };

  if (!currentBookings || currentBookings.length === 0) {
    return (
      <div className="tw-text-center tw-text-gray-400">
        Không có đặt phòng nào trong trang này.
      </div>
    );
  }

  const [cancelReason, setCancelReason] = useState<string>("");
  const handleCancelBooking = async (bookingId: string, userId: string) => {
    try {
      // Bước 1: Xem phí huỷ
      const previewRes = await previewCancellationFee(bookingId, userId);
      if (!previewRes.success) {
        toast.error(previewRes.message || "Không thể xem phí huỷ.");
        return;
      }
      const { can_cancel, fee_percent, fee_amount } = previewRes.data;

      // Bước 2: Hiển thị xác nhận
      if (!can_cancel) {
        toast.error("Đặt phòng này không thể huỷ.");
        return;
      }
      const confirmed = await showConfirmDialog(
        "Xác nhận huỷ đặt phòng",
        `Bạn sẽ bị trừ ${formatCurrencyVN(
          fee_amount
        )} (${fee_percent}%) nếu huỷ bây giờ.\n Bạn có chắc chắn muốn huỷ không? \n
        Lưu ý: Số tiền hoàn lại sẽ được chuyển vào ví của bạn.`
      );
      if (!confirmed) return;

      // Hiển thị hộp thoại nhập lý do huỷ
      const reason = await showTextareaInputDialog(
        "Lý do huỷ đặt phòng",
        "Vui lòng nhập lý do huỷ (tùy chọn)",
        "Ví dụ: thay đổi kế hoạch, giá cao, đặt nhầm..."
      );
      if (reason === null) return;
      console.log("Lý do huỷ:", reason);
      setCancelReason(reason);

      // Bước 3: Thực hiện huỷ
      const response = await cancelBooking(bookingId, userId, cancelReason);
      if (response.success) {
        toast.success(response.message || "Huỷ đặt phòng thành công.");
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === bookingId
              ? {
                  ...booking,
                  booking_status: { code: "CANCELLED", name: "Cancelled" },
                }
              : booking
          )
        );
        setExpandedId(null); // Đóng chi tiết nếu đang mở
      } else {
        toast.error(response.message || "Huỷ đặt phòng thất bại.");
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi huỷ đặt phòng. Vui lòng thử lại sau.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tw-space-y-4"
    >
      {currentBookings?.map((booking: Booking) => {
        const isCheckedOut = booking.booking_status.code === "CHECKED_OUT";
        const payments = booking.payments;

        return (
          <div
            key={booking.id}
            className="tw-p-4 tw-rounded-xl tw-border tw-border-gray-700 tw-bg-black/50"
          >
            <div
              className="tw-flex tw-gap-4 tw-cursor-pointer"
              onClick={() => toggleExpand(booking.id)}
            >
              <div className="tw-space-y-2">
                <h3 className="tw-text-lg tw-font-bold tw-text-white">
                  {booking.booking_details?.[0].room_class.name ||
                    "Không rõ loại phòng"}
                </h3>
                <p className="tw-text-sm tw-text-gray-400">
                  Ngày đến: {formatDate(booking.check_in_date)} - Ngày đi:{" "}
                  {formatDate(booking.check_out_date)}
                </p>
                <p className="tw-text-sm tw-text-gray-400">
                  Số người lớn: {booking.adult_amount || 0} - Số trẻ em:{" "}
                  {booking.child_amount || 0}
                </p>
                <p className="tw-text-sm tw-text-gray-300">
                  Thông tin người đặt:
                </p>
                <ul className="tw-list-disc tw-text-gray-300 tw-text-sm/3">
                  <li>
                    <p>Họ và tên: {booking.full_name || "Không rõ"}</p>
                  </li>
                  <li>
                    <p>Số điện thoại: {booking.phone_number || "Không rõ"}</p>
                  </li>
                  <li>
                    <p>Email: {booking.email || "Không rõ"}</p>
                  </li>
                </ul>

                <span
                  className={`tw-inline-block tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-rounded-full tw-uppercase ${getColorClass(
                    booking.booking_status.code
                  )}`}
                >
                  {booking.booking_status.name}
                </span>
              </div>
              <div className="tw-flex-1 tw-text-right">
                {booking.booking_status.code !== "CANCELLED" &&
                  booking.booking_status.code !== "CHECKED_OUT" &&
                  booking.booking_status.code !== "CHECKED_IN" && (
                    <AnimatedButtonPrimary
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelBooking(booking.id, booking.user_id || "");
                      }}
                      className="tw-px-4 tw-py-2"
                    >
                      Huỷ đặt phòng
                    </AnimatedButtonPrimary>
                  )}
              </div>
            </div>

            <AnimatePresence>
              {expandedId === booking.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="tw-overflow-hidden tw-mt-4 tw-text-gray-300 tw-text-sm"
                >
                  <div className="tw-w-full tw-max-w-3xl tw-mx-auto tw-flex tw-flex-col tw-gap-6">
                    {booking.booking_details?.map((detail: BookingDetail) => {
                      const room = detail.room;
                      const roomClass = detail.room_class;
                      return (
                        <div
                          key={detail.room_class_id}
                          className="tw-border-t tw-border-gray-600 tw-pt-4 tw-flex tw-gap-4 tw-items-start"
                        >
                          <div className="tw-w-[50%] tw-h-[300px] tw-relative tw-flex tw-items-center tw-justify-center">
                            <motion.img
                              initial={{ x: -30, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ duration: 0.3 }}
                              src={getImageUrl(roomClass?.images?.[0]?.url)}
                              alt="room"
                              className="tw-w-full tw-h-full tw-object-cover tw-object-center"
                            />
                          </div>

                          <motion.div
                            initial={{ x: 30, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="tw-flex-1 tw-space-y-2"
                          >
                            <p>
                              <strong>Phòng:</strong> {room?.name || "Chưa gán"}{" "}
                              {room?.floor && `- Tầng ${room.floor}`}
                            </p>
                            <p>
                              <strong>Dịch vụ:</strong>
                            </p>
                            <ul className="tw-list-disc tw-ml-6">
                              {detail.services?.length > 0 ? (
                                detail.services.map(
                                  (service: ServiceBooking) => (
                                    <li key={service.id}>
                                      {service.service.name} - {service.amount}x
                                      -{" "}
                                      {service.service.price.toLocaleString(
                                        "vi-VN"
                                      )}
                                      ₫
                                    </li>
                                  )
                                )
                              ) : (
                                <li>Không sử dụng dịch vụ</li>
                              )}
                            </ul>
                          </motion.div>
                        </div>
                      );
                    })}

                    <motion.div
                      initial={{ x: 30, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="tw-space-y-2 tw-border-t tw-border-gray-600 tw-pt-4"
                    >
                      <p>
                        <strong>Yêu cầu:</strong>{" "}
                        {booking.request || "Không có"}
                      </p>
                      <p>
                        <strong>Ghi chú:</strong> {booking.note || "Không có"}
                      </p>
                      <p>
                        <strong>Thời gian đặt:</strong>{" "}
                        {formatDate(booking.createdAt || "")}
                      </p>
                      <p>
                        <strong>Hình thức:</strong>{" "}
                        {booking.booking_method.name || "Không xác định"}
                      </p>
                      <strong>Thanh toán:</strong>{" "}
                      {payments && payments.length > 0 ? (
                        <ul className="tw-list-disc tw-ml-6">
                          {payments.map((payment: Payment) => (
                            <li key={payment.id}>
                              {payment.payment_method.name} -{" "}
                              {payment.amount.toLocaleString("vi-VN")}₫ -{" "}
                              {payment.status}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        "Chưa thanh toán"
                      )}
                    </motion.div>
                  </div>
                  {booking.discounts && booking.discounts.length > 0 && (
                    <motion.div
                      initial={{ x: 30, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="tw-space-y-2 tw-border-t tw-border-gray-600 tw-pt-4"
                    >
                      <p className="tw-font-semibold tw-text-primary">
                        Giảm giá áp dụng:
                      </p>
                      <ul className="tw-list-disc tw-ml-6">
                        {booking.discounts.map(
                          (discount: Discount, index: number) => (
                            <li
                              key={discount.id || index}
                              className="tw-text-sm"
                            >
                              <p>
                                <strong>{discount.name}</strong>:{" "}
                                {discount.value_type === "percent"
                                  ? `${discount.value * 100}%`
                                  : `${formatCurrencyVN(discount.value)}`}
                                <br />
                                <span className="tw-text-gray-400">
                                  Hiệu lực từ {formatDate(discount.valid_from)}{" "}
                                  đến {formatDate(discount.valid_to)}
                                </span>
                              </p>
                            </li>
                          )
                        )}
                      </ul>
                      <motion.div
                        initial={{ x: 30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="tw-space-y-1 tw-border-t tw-border-gray-600 tw-pt-4"
                      >
                        <p>
                          <strong>Giá gốc:</strong>{" "}
                          <span className="tw-line-through tw-text-gray-400">
                            {formatCurrencyVN(booking.original_price)}
                          </span>
                        </p>
                        <p>
                          <strong>Giá sau giảm:</strong>{" "}
                          <span className="tw-text-primary tw-font-semibold">
                            {formatCurrencyVN(booking.total_price)}
                          </span>
                        </p>
                      </motion.div>
                    </motion.div>
                  )}
                  {isCheckedOut && (
                    <AnimatedButtonPrimary
                      onClick={() => {
                        router.push(`/review/${booking.id}`);
                      }}
                      className="tw-w-full tw-mt-4 tw-py-2 tw-text-center"
                    >
                      Đánh giá
                    </AnimatedButtonPrimary>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
      {totalPages > 1 && (
        <Pagination
          pageCount={totalPages}
          onPageChange={handlePageChange}
          forcePage={currentPage - 1}
        />
      )}
    </motion.div>
  );
}
