"use client";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const ServicesPage = dynamic(() => import("./_client"));

export default function ClientWrapper() {
  return (
    <Suspense fallback={<p>Đang tải loại phòng...</p>}>
      <ServicesPage />
    </Suspense>
  );
}
