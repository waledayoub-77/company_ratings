import { Star } from 'lucide-react'

export default function StarRating({
  rating,
  max = 5,
  size = 18,
  interactive = false,
  onChange,
}) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.floor(rating)
        const partial = !filled && i < rating
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(i + 1)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform duration-150`}
          >
            <Star
              size={size}
              strokeWidth={1.5}
              className={
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : partial
                  ? 'fill-amber-200 text-amber-300'
                  : 'fill-navy-100 text-navy-200'
              }
            />
          </button>
        )
      })}
    </div>
  )
}
