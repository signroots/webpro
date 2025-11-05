import { ButtonProps as OriginalButtonProps } from '../../Model/Form';
import React from 'react';

import PageLoader from '../PageLoader';

// Extend the ButtonProps interface to include `hidden`
interface ButtonProps extends OriginalButtonProps {
  hidden?: boolean; // Add the `hidden` property
}

export const Button: React.FC<ButtonProps> = ({
  className,
  type,
  title,
  disabled = false,
  loading = false,
  handleClick,
  tooltip,
  icon,
  hidden = false, // Use `hidden` here
}) => {
  const onClickHandler = () => {
    if (handleClick) {
      handleClick();
    }
  };

  return (
    <button
      onClick={onClickHandler}
      className={`px-[25px] py-3 transition-all cursor-pointer ${className} ${disabled && 'opacity-60 cursor-not-allowed'} ${hidden && 'hidden'}`} // Add conditional `hidden` class
      type={type}
      disabled={disabled || loading}
      title={tooltip}
    >
      {icon && icon}
      {title}
      {loading && <PageLoader />}
    </button>
  );
};

export default Button;
