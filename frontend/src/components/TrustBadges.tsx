import React from 'react';

const trustItems = [
  {
    title: 'NATURAL INGREDIENTS',
    subtitle: 'Pure & Organic',
    icon: (
      <svg className="w-6 h-6 text-[#24492d] stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M12 8a3 3 0 0 0-3 3c0 2 3 5 3 5s3-3 3-5a3 3 0 0 0-3-3z" />
      </svg>
    )
  },
  {
    title: 'SUSTAINABLE PRACTICES',
    subtitle: 'Eco Friendly',
    icon: (
      <svg className="w-6 h-6 text-[#24492d] stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    )
  },
  {
    title: 'QUALITY ASSURED',
    subtitle: 'Tested & Certified',
    icon: (
      <svg className="w-6 h-6 text-[#24492d] stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 11 12 14 22 4" />
      </svg>
    )
  },
  {
    title: 'MADE WITH CARE',
    subtitle: 'For Your Wellness',
    icon: (
      <svg className="w-6 h-6 text-[#24492d] stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    )
  }
];

export default function TrustBadges() {
  return (
    <section className="bg-[#f7f9f6] py-6 border-t border-[#e2eae2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
          {trustItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-3 justify-center md:justify-start"
            >
              <div className="p-2 rounded-full bg-[#ecf2ed] flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <h4 className="text-[11px] sm:text-xs font-bold tracking-[0.14em] text-[#1c3f24] uppercase">
                  {item.title}
                </h4>
                <p className="text-[11px] text-[#6b7b6e]">
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
