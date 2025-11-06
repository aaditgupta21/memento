import Link from "next/link";
import { CameraIcon, HeartIcon, SparklesIcon } from "lucide-react";




export default function Landing() {
  const sampleMemories = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    'https://explorerchick.com/wp-content/uploads/2023/08/hiking_groups1.jpg',
    'https://i0.pickpik.com/photos/58/125/279/nature-mountains-hiking-outddors-preview.jpg'
  ]


  return (
    <div className="min-h-screen bg-[#e5cbc1]">
      <div className="max-w-7xl mx-auto px-6 py-12">

        <div className="text-center mb-8">

          <h1 className="font-serif text-6xl md:text-7xl text-[#928a7b] mb-4">
            Memento
          </h1>

          <h2 className="text-xl text-[#928a7b]/80 font-sans">
            Capture. Reflect. Relive.
          </h2>

        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">

          <div className=" bg-white/45 rounded-3xl p-8 shadow-md">
            <div className="bg-[#FF8559]/20 w-16 h-16 rounded-full flex items-center justify-center mb-3">
              <CameraIcon className="text-[#FF8559]" size={35} />
            </div>
            <h3 className="font-serif font-medium text-2xl text-[#938976] mb-2">
              Capture
            </h3>
            <p className="text-[#A49A87] font-sans">
              Preserve your precious moments with photos and heartfelt captions
            </p>
          </div>

          <div className=" bg-white/45 rounded-3xl p-8 shadow-md">
            <div className="bg-[#069494]/20 w-16 h-16 rounded-full flex items-center justify-center mb-3">
              <HeartIcon className="text-[#069494]" size={35} />
            </div>
            <h3 className="font-serif font-medium text-2xl text-[#938976] mb-2">
              Reflect
            </h3>
            <p className="text-[#A49A87] font-sans">
              Add meaning to your memories with personal notes and reflections
            </p>
          </div>

          <div className=" bg-white/45 rounded-3xl p-8 shadow-md">
            <div className="bg-[#c096e6]/20 w-16 h-16 rounded-full flex items-center justify-center mb-3">
              <SparklesIcon className="text-[#c096e6]" size={35} />
            </div>
            <h3 className="font-serif font-medium text-2xl text-[#938976] mb-2">
              Relive
            </h3>
            <p className="text-[#A49A87] font-sans">
              Journey through your timeline and rediscover cherished moments
            </p>
          </div>

        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-10">
          {sampleMemories.map((image, index) => (
            <img key={index} src={image} alt={'Memory ${index+1}'} className = "rounded-3xl shadow-lg w-full h-full object-cover"/>
          ))}
          

        </div>

        <div className="flex gap-4 justify-center">

          <Link href="/signup">
            <button className="bg-[#da8d72] hover:bg-[#da8d72]/80 text-gray-100/90 px-8 py-4 rounded-full font-bold font-sans transition-all hover:scale-105 shadow-md">
              Get Started
            </button>
          </Link>

          <Link href="/login">
            <button className="bg-white/80 hover:bg-white text-[#928a7b]/80 px-8 py-4 rounded-full font-bold font-sans transition-all hover:scale-105 shadow-md">
              Login
            </button>
          </Link>

        </div>

      </div>
    </div>
  );
}
