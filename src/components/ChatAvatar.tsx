// Who said what, at a glance.
//
// Every name gets its own colour, picked from the name itself rather than
// from the order people arrived — so the same person is the same colour in
// the chat, in the panel, and after a reload, and two people talking never
// look like one.
import React from 'react';

// Chosen to stay legible on the dark room background and to stay apart from
// each other; the brand blue is deliberately absent, since it marks "you".
const PALETTE = [
  { text: 'text-[#f4a4c0]', bg: 'bg-[#f4a4c0]' },
  { text: 'text-[#f7b267]', bg: 'bg-[#f7b267]' },
  { text: 'text-[#9be7a1]', bg: 'bg-[#9be7a1]' },
  { text: 'text-[#8fd6ff]', bg: 'bg-[#8fd6ff]' },
  { text: 'text-[#d3b5f7]', bg: 'bg-[#d3b5f7]' },
  { text: 'text-[#ffd166]', bg: 'bg-[#ffd166]' },
  { text: 'text-[#7ce0d3]', bg: 'bg-[#7ce0d3]' },
  { text: 'text-[#ffa8a8]', bg: 'bg-[#ffa8a8]' },
];

const MINE = { text: 'text-[#9ec1ff]', bg: 'bg-[#194cbf]' };

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function senderColors(name: string, mine = false) {
  if (mine) return MINE;
  const key = (name || '').trim();
  if (!key) return PALETTE[0];
  return PALETTE[hash(key) % PALETTE.length];
}

interface Props {
  name: string;
  avatarUrl?: string | null;
  mine?: boolean;
  size?: number;
}

const ChatAvatar: React.FC<Props> = ({ name, avatarUrl, mine = false, size = 28 }) => {
  const colors = senderColors(name, mine);
  const letter = (name || '؟').trim().charAt(0).toUpperCase();
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full font-bold text-[#0b1020] ${colors.bg}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      title={name}
      aria-hidden="true"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="h-full w-full object-cover"
          // A broken link should leave the initial, not an empty circle.
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        letter
      )}
    </span>
  );
};

export default ChatAvatar;
