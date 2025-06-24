import React from "react";
import clsx from "clsx";

export function Badge({ variant = "default", className = "", children, ...props }) {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium";
  
  const variants = {
    default: "bg-gray-100 text-gray-800",
    outline: "border border-gray-300 text-gray-800 bg-white",
    success: "bg-green-100 text-green-800",
    danger: "bg-red-100 text-red-800",
    
  };

  return (
    <span
      className={clsx(baseClasses, variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}
