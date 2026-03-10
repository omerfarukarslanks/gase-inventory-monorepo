"use client";
import { useEffect, useState } from "react";
import { getAllSuppliers, type Supplier } from "@/lib/suppliers";

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    getAllSuppliers({ isActive: true })
      .then(setSuppliers)
      .catch(() => setSuppliers([]));
  }, []);

  return { suppliers };
}
