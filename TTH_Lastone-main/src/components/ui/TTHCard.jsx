import React from "react"
export function Card({ className = "", children, ...props }) {
  return (
    <div className={`rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ className = "", children, ...props }) {
  return (
    <div className={`p-6 border-b border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className = "", children, ...props }) {
  return (
    <h3 className={`text-xl font-semibold leading-none tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ className = "", children, ...props }) {
  return (
    <p className={`text-sm text-gray-500 mt-2 ${className}`} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ className = "", children, ...props }) {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className = "", children, ...props }) {
  return (
    <div className={`p-6 pt-0 flex items-center ${className}`} {...props}>
      {children}
    </div>
  )
}
