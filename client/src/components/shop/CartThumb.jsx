import ImagePlaceholder from './ImagePlaceholder.jsx';

export default function CartThumb({ image, category, className = 'h-20 w-20' }) {
  return (
    <div className={`${className} shrink-0 overflow-hidden rounded-lg bg-slate-100`}>
      {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <ImagePlaceholder category={category} className="[&>span]:text-3xl" />}
    </div>
  );
}
