import { useCallback, useEffect, useRef, useState } from "react"
import { useDropzone } from "react-dropzone"
import invariant from "tiny-invariant"
import { classNames } from "./classNames"

export function ImageInput({
  label,
  id,
  name,
}: {
  label: string
  id: string
  name: string
}) {
  const [resetKey, setResetKey] = useState(() => Math.random())
  const reset = () => {
    setResetKey(Math.random())
  }

  return (
    <>
      <div className="flex justify-between">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <button
          className="inline-flex items-center px-2.5 border border-transparent text-xs font-medium rounded text-rose-700 bg-rose-100 hover:bg-rose-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
          type="button"
          onClick={reset}
        >
          Clear
        </button>
      </div>

      <FileZone id={id} key={resetKey} name={name} />
    </>
  )
}

function FileZone({ id, name }: { id: string; name: string }) {
  const input = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<string[]>([])
  const onDrop = useCallback(
    (acceptedFiles) => {
      // Do something with the files

      invariant(input.current)

      const dT = new DataTransfer()
      for (const file of acceptedFiles) {
        dT.items.add(file)
      }

      input.current.files = dT.files
      setImages(Array.from(dT.files).map((file) => URL.createObjectURL(file)))
    },
    [input.current]
  )
  const { getRootProps, getInputProps, isDragActive, draggedFiles } =
    useDropzone({ onDrop })

  useEffect(() => {
    return function cleanup() {
      // Avoid memory leaks
      images.forEach((image) => URL.revokeObjectURL(image))
    }
  }, [images])

  return (
    <div
      {...getRootProps()}
      className={classNames(
        "flex justify-center px-6 mt-1 py-2 border-2 border-gray-300 border-dashed rounded-md",
        isDragActive ? "bg-gray-50" : images.length ? "bg-white" : ""
      )}
    >
      <div
        className={classNames("bg-center bg-no-repeat bg-contain")}
        style={{
          backgroundImage: draggedFiles.length
            ? `url(${draggedFiles[0]})`
            : images.length
            ? `url(${images[0]})`
            : "none",
        }}
      >
        <div className={images.length ? "opacity-0 pointer-events-none" : ""}>
          <div className="pt-5 space-y-1 text-center pb-7 ">
            <svg
              className="w-20 h-20 mx-auto text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex items-baseline text-sm text-gray-600">
              <label
                htmlFor={id}
                className="inline-flex items-center px-2.5 cursor-pointer border border-transparent font-medium rounded text-rose-700 bg-rose-100 hover:bg-rose-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
              >
                <span>Upload a file</span>
                <input
                  {...getInputProps()}
                  ref={input}
                  id={id}
                  name={name}
                  type="file"
                  className="sr-only"
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>
      </div>
    </div>
  )
}
