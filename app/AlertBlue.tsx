export function AlertBlue({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props}>
      <div className="p-4 rounded-md bg-blue-50" role="alert">
        <div className="flex">
          <div className="shrink-0">
            <span className="w-5 h-5 text-blue-400" aria-hidden="true"> 💙 </span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">{children}</h3>
          </div>
        </div>
      </div>
    </div>
  )
}
