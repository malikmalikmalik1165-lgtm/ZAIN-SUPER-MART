"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeDisplayProps {
  value: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  className?: string;
}

export function BarcodeDisplay({
  value,
  width = 2,
  height = 60,
  displayValue = true,
  className = "",
}: BarcodeDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          width,
          height,
          displayValue,
          fontSize: 14,
          margin: 5,
          background: "transparent",
        });
      } catch {
        // Invalid barcode value — show fallback
      }
    }
  }, [value, width, height, displayValue]);

  if (!value) return null;

  return <svg ref={svgRef} className={className} />;
}
