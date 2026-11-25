import { Suspense } from "react";
import { CatalogPage } from "@/components/CatalogPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" />}>
      <CatalogPage />
    </Suspense>
  );
}