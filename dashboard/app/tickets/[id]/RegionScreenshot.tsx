"use client";

import { useEffect, useRef, useState } from "react";
import { Region } from "@/lib/types";

// 스크린샷 위에 region 빨간 반투명 박스를 오버레이.
// region 좌표는 viewportWidth/Height 기준(CSS px)이므로 실제 표시된 이미지 크기에 비례 스케일링한다.
export default function RegionScreenshot({
  src,
  region,
}: {
  src: string;
  region: Region | null;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    function measure() {
      const el = imgRef.current;
      if (el) setSize({ w: el.clientWidth, h: el.clientHeight });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const showOverlay =
    region &&
    size &&
    region.viewportWidth > 0 &&
    region.viewportHeight > 0;

  let boxStyle: React.CSSProperties | null = null;
  if (showOverlay) {
    const scaleX = size!.w / region!.viewportWidth;
    const scaleY = size!.h / region!.viewportHeight;
    boxStyle = {
      left: region!.x * scaleX,
      top: region!.y * scaleY,
      width: region!.width * scaleX,
      height: region!.height * scaleY,
    };
  }

  return (
    <div className="relative inline-block max-w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt="스크린샷"
        className="block max-w-full rounded border border-gray-200"
        onLoad={() => {
          const el = imgRef.current;
          if (el) setSize({ w: el.clientWidth, h: el.clientHeight });
        }}
      />
      {boxStyle && (
        <div
          className="pointer-events-none absolute border-2 border-red-500 bg-red-500/30"
          style={boxStyle}
          data-testid="region-overlay"
        />
      )}
    </div>
  );
}
