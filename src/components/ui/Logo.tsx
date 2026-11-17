import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

export const Logo: React.FC<LogoProps> = ({
  className = 'w-4 h-4',
  size,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 124 124"
      fill="none"
      width={size}
      height={size}
      className={className}
      aria-label="CodeWhy Logo"
      {...props}
    >
      <path
        d="M18.5 20.5
          L39.5 46.5
          L51.5 62.5
          L62 44.5
          L73 62.5
          L91 36
          L104.5 18.5
          L103.5 69
          C103.5 91.5 86 107 62 107
          C38 107 20.5 91.5 20.5 69
          L18.5 28.5Z"
        fill="currentColor"
      />
    </svg>
  );
};