export function AlertRed({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props}>
      <div className="p-4 rounded-md bg-red-50" role="alert">
        <div className="flex">
          <div className="shrink-0">
            <span className="w-5 h-5 text-red-400" aria-hidden="true"> X </span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{children}</h3>
          </div>
        </div>
      </div>
    </div>
  )
}
