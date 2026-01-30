import React from "react";

export const GradientText: React.FC<{
  gradient: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ gradient, children, style }) => {
  return (
    <span
      style={{
        background: gradient,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        ...style,
      }}
    >
      {children}
    </span>
  );
};
