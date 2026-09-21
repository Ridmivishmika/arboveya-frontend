import React from 'react';

const valueItems = [
  {
    title: '100% NATURAL',
    subtitle: 'Pure & Organic Ingredients',
    icon: (
      <svg className="w-6 h-6 text-white stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M12 8a3 3 0 0 0-3 3c0 2 3 5 3 5s3-3 3-5a3 3 0 0 0-3-3z" />
      </svg>
    )
  },
  {
    title: 'NO CHEMICALS',
    subtitle: 'Safe & Clean Formulations',
    icon: (
      <svg className="w-6 h-6 text-white stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0" />
        <line x1="8.5" y1="14" x2="15.5" y2="14" />
      </svg>
    )
  },
  {
    title: 'PREMIUM QUALITY',
    subtitle: 'Highest Quality Standards',
    icon: (
      <svg className="w-6 h-6 text-white stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="8" r="6" />
        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
      </svg>
    )
  },
  {
    title: 'WORLDWIDE SHIPPING',
    subtitle: 'Fast & Reliable Delivery',
    icon: (
      <svg className="w-6 h-6 text-white stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    )
  }
];

export default function ValueBanner() {
  return (
    <section className="bg-[#2b4c33] text-white py-6 border-y border-[#24402a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 items-center">
          {valueItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-3.5 px-2 md:border-r last:border-r-0 border-[#3d6547]"
            >
              <div className="flex-shrink-0 p-2 rounded-lg bg-[#3a5f42]/60">
                {item.icon}
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold tracking-[0.12em] text-white uppercase">
                  {item.title}
                </h4>
                <p className="text-[11px] text-[#b4d2bc] font-light leading-tight mt-0.5">
                  {item.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
