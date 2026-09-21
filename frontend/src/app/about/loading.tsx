import React from 'react';

export default function AboutLoading() {
  return (
    <div className="bg-white min-h-screen animate-pulse">
      {/* OUR STORY SECTION SKELETON */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-16 sm:pb-20 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-14 lg:gap-16 items-center">
          {/* Image skeleton */}
          <div className="w-full aspect-[4/3] rounded-2xl bg-stone-200" />

          {/* Text skeleton */}
          <div className="space-y-4">
            <div className="h-6 w-36 bg-stone-200 rounded-md mb-6" />
            <div className="h-4 w-full bg-stone-200 rounded" />
            <div className="h-4 w-11/12 bg-stone-200 rounded" />
            <div className="h-4 w-4/5 bg-stone-200 rounded" />
            <div className="h-4 w-full bg-stone-200 rounded mt-4" />
            <div className="h-4 w-3/4 bg-stone-200 rounded" />
          </div>
        </div>
      </section>

      {/* VALUES STRIP SKELETON */}
      <section className="border-y border-stone-200 bg-[#f9faf9] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-stone-200 mb-3" />
              <div className="h-4 w-28 bg-stone-200 rounded mb-1.5" />
              <div className="h-3 w-20 bg-stone-100 rounded" />
            </div>
          ))}
        </div>
      </section>

      {/* MISSION & VISION SKELETON */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <div className="h-6 w-36 bg-stone-200 rounded-md mb-4" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-stone-200 rounded" />
              <div className="h-4 w-5/6 bg-stone-200 rounded" />
            </div>
          </div>
          <div>
            <div className="h-6 w-36 bg-stone-200 rounded-md mb-4" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-stone-200 rounded" />
              <div className="h-4 w-4/6 bg-stone-200 rounded" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
