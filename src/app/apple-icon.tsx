import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const bar = (opacity: number, rotate = 0) => (
    <div
      style={{
        width: 26,
        height: 92,
        borderRadius: 7,
        background: "#f5f5f5",
        opacity,
        transform: `rotate(${rotate}deg)`,
      }}
    />
  );
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 12,
          paddingBottom: 44,
          background: "#111111",
        }}
      >
        {bar(1)}
        {bar(0.6)}
        {bar(0.35, -10)}
      </div>
    ),
    size,
  );
}
