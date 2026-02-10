"use client";

import { HomeIcon, LifeBuoyIcon, FacebookIcon } from "lucide-react";

const iconAnimation = `
@keyframes wiggle {
  0% { transform: scale(1) rotate(0deg); }
  8% { transform: scale(1.3) rotate(0deg); }
  14% { transform: scale(1.3) rotate(-6deg); }
  20% { transform: scale(1.3) rotate(6deg); }
  26% { transform: scale(1.3) rotate(-6deg); }
  32% { transform: scale(1.3) rotate(6deg); }
  38% { transform: scale(1.3) rotate(-6deg); }
  44% { transform: scale(1.3) rotate(6deg); }
  50% { transform: scale(1.3) rotate(0deg); }
  58% { transform: scale(1) rotate(0deg); }
  100% { transform: scale(1) rotate(0deg); }
}
`;

const links = [
  {
    label: "Trang chủ",
    href: "https://copee.vn/",
    icon: HomeIcon,
  },
  {
    label: "Hỗ trợ",
    href: "https://hoanglongteam.bio.link",
    icon: LifeBuoyIcon,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/thanhlong4107",
    icon: FacebookIcon,
  },
];

export default function ContactBar() {
  return (
    <>
      <style>{iconAnimation}</style>
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div className="flex gap-1.5 rounded-t-md bg-green-500 px-2 py-1.5 pointer-events-auto shadow-lg">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded bg-white/20 px-5 py-2.5 text-white font-medium transition-colors hover:bg-white/30"
            >
              <link.icon
                className="h-5 w-5"
                style={{ animation: "wiggle 2s ease-in-out infinite" }}
              />
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
