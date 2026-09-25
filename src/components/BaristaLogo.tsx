import React from 'react';

interface BaristaLogoProps {
  className?: string;
  size?: number;
  variant?: 'circle' | 'horizontal' | 'text';
}

export const BaristaLogo: React.FC<BaristaLogoProps> = ({ 
  className = 'w-9 h-9', 
  size, 
  variant = 'circle' 
}) => {
  if (variant === 'horizontal') {
    return (
      <div 
        className={`inline-flex items-center shrink-0 ${className}`}
        style={size ? { height: size } : undefined}
      >
        <svg 
          viewBox="0 0 450 140" 
          className="h-full w-auto"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 'B' */}
          <path 
            d="M 25 15 H 68 C 82 15, 90 23, 90 38 C 90 50, 82 58, 70 63 C 85 68, 93 76, 93 92 C 93 112, 80 125, 64 125 H 25 V 15 Z M 44 32 V 58 H 63 C 71 58, 75 53, 75 45 C 75 37, 71 32, 63 32 H 44 Z M 44 73 V 108 H 65 C 73 108, 78 103, 78 90 C 78 79, 73 73, 65 73 H 44 Z" 
            fill="#ED5338" 
          />
          {/* 'A' */}
          <path 
            d="M 125 15 H 145 L 180 125 H 159 L 152 98 H 118 L 111 125 H 90 L 125 15 Z M 147 81 L 135 38 L 123 81 H 147 Z" 
            fill="#ED5338" 
          />
          {/* 'R' */}
          <path 
            d="M 195 15 H 238 C 255 15, 264 25, 264 45 C 264 61, 255 71, 241 75 L 268 125 H 246 L 222 79 H 214 V 125 H 195 V 15 Z M 214 32 V 64 H 234 C 243 64, 248 59, 248 48 C 248 37, 243 32, 234 32 H 214 Z" 
            fill="#ED5338" 
          />
          {/* 'I' */}
          <path 
            d="M 280 15 H 299 V 125 H 280 V 15 Z" 
            fill="#ED5338" 
          />
          {/* 'S' (Raised condensed) */}
          <path 
            d="M 314 36 C 314 22, 324 15, 342 15 C 360 15, 370 23, 370 37 C 370 51, 360 57, 347 62 C 331 68, 325 73, 325 82 C 325 91, 332 96, 343 96 C 354 96, 361 90, 362 79 H 378 C 377 98, 366 107, 343 107 C 322 107, 310 97, 310 81 C 310 67, 320 60, 333 55 C 349 49, 354 44, 354 36 C 354 28, 348 24, 341 24 C 332 24, 328 29, 328 36 H 314 Z" 
            fill="#ED5338" 
          />
          {/* Dark Espresso Underline Bar under IS */}
          <rect 
            x="280" 
            y="114" 
            width="90" 
            height="11" 
            rx="2" 
            fill="#3E1812" 
          />
          {/* 'T' */}
          <path 
            d="M 382 15 H 438 V 32 H 419 V 125 H 400 V 32 H 382 V 15 Z" 
            fill="#ED5338" 
          />
          {/* 'A' */}
          <path 
            d="M 470 15 H 490 L 525 125 H 504 L 497 98 H 463 L 456 125 H 435 L 470 15 Z M 492 81 L 480 38 L 468 81 H 492 Z" 
            fill="#ED5338" 
            transform="translate(-25, 0)"
          />
          {/* Registered Symbol ® */}
          <circle cx="510" cy="22" r="7" stroke="#ED5338" strokeWidth="1.5" fill="none" />
          <text x="507.5" y="25" fill="#ED5338" fontSize="8" fontWeight="bold" fontFamily="sans-serif">R</text>
        </svg>
      </div>
    );
  }

  // Official Barista Circle Logo (Identical to uploaded Barista-Circle-Logo-PNG-1000x1000-1.png)
  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full shadow-md overflow-hidden bg-[#ED5338] transition-transform hover:scale-105 ${className}`}
      style={size ? { width: size, height: size } : undefined}
      title="Barista Coffee Lanka"
    >
      <svg 
        viewBox="0 0 1000 1000" 
        className="w-full h-full"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Coral Orange Circular Base (#ED5338) */}
        <circle cx="500" cy="500" r="500" fill="#ED5338" />

        {/* --- OFFICIAL BARISTA CONDENSED WORDMARK (WHITE) --- */}
        
        {/* Letter 'B' */}
        <path 
          d="M 125 330 H 202 C 235 330 252 350 252 385 C 252 414 235 432 208 443 C 241 454 258 474 258 510 C 258 558 228 588 192 588 H 125 V 330 Z M 167 369 V 433 H 194 C 213 433 222 422 222 402 C 222 381 213 369 194 369 H 167 Z M 167 468 V 549 H 197 C 217 549 228 537 228 508 C 228 480 217 468 197 468 H 167 Z" 
          fill="#FFFFFF" 
        />

        {/* Letter 'A' */}
        <path 
          d="M 292 330 H 332 L 398 588 H 356 L 343 529 H 277 L 264 588 H 225 L 292 330 Z M 335 491 L 312 386 L 289 491 H 335 Z" 
          fill="#FFFFFF" 
        />

        {/* Letter 'R' */}
        <path 
          d="M 412 330 H 488 C 522 330 539 350 539 392 C 539 427 523 448 497 457 L 546 588 H 504 L 460 467 H 452 V 588 H 412 V 330 Z M 452 368 V 435 H 482 C 500 435 510 424 510 402 C 510 380 500 368 482 368 H 452 Z" 
          fill="#FFFFFF" 
        />

        {/* Letter 'I' */}
        <path 
          d="M 552 330 H 591 V 588 H 552 V 330 Z" 
          fill="#FFFFFF" 
        />

        {/* Letter 'S' (Raised compact glyph) */}
        <path 
          d="M 608 376 C 608 344 626 330 659 330 C 692 330 710 346 710 378 C 710 406 692 419 668 429 C 639 441 628 451 628 471 C 628 490 641 501 661 501 C 681 501 695 489 696 466 H 725 C 723 506 703 526 661 526 C 622 526 601 505 601 469 C 601 439 619 424 643 414 C 672 402 681 392 681 376 C 681 359 670 351 657 351 C 641 351 634 362 634 376 H 608 Z" 
          fill="#FFFFFF" 
        />

        {/* Dark Espresso Underline Bar under IS (#3E1812) */}
        <rect 
          x="552" 
          y="544" 
          width="170" 
          height="24" 
          rx="3" 
          fill="#3E1812" 
        />

        {/* Letter 'T' */}
        <path 
          d="M 726 330 H 832 V 368 H 799 V 588 H 759 V 368 H 726 V 330 Z" 
          fill="#FFFFFF" 
        />

        {/* Letter 'A' (Final) */}
        <path 
          d="M 855 330 H 895 L 961 588 H 919 L 906 529 H 840 L 827 588 H 788 L 855 330 Z M 898 491 L 875 386 L 852 491 H 898 Z" 
          fill="#FFFFFF" 
        />
      </svg>
    </div>
  );
};
