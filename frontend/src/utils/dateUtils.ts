export const formatDate = (dateStr: string | Date) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return "Ngày không hợp lệ";
  }

  // Định dạng giờ Việt Nam
  const vietnamDate = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
  );

  const day = vietnamDate.getDate().toString().padStart(2, "0");
  const month = (vietnamDate.getMonth() + 1).toString().padStart(2, "0");
  const year = vietnamDate.getFullYear();

  const hour = vietnamDate.getHours().toString().padStart(2, "0");
  const minute = vietnamDate.getMinutes().toString().padStart(2, "0");

  return `${day}/${month}/${year} lúc ${hour}:${minute}`;
};

export const formatDateForBooking = (dateStr: string) => {
  const [day, month, year] = dateStr.split("/").map(Number);
  return `${year}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
};
