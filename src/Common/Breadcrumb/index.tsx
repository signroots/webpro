import React from 'react';
import { AiFillInfoCircle } from 'react-icons/ai';
import { BiLeftArrowAlt } from 'react-icons/bi';
import { Link, useNavigate } from 'react-router';

const Breadcrumb: React.FC<{
  src?: string;
  title?: string;
  link?: string;
  icon?: boolean;
  sub?: any;
  backLink?: string;
  rootClass?: string;
}> = ({ src, title, link, icon, sub, backLink, rootClass }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (backLink) {
      navigate(backLink);
    } else {
      navigate(-1);
    }
  };

  return (
    <div
      className={`text-black font-semibold rounded-lg flex gap-4 items-center mb-4 ${rootClass}`}
    >
      <div
        className="p-1 bg-white rounded-full border-2 border-black cursor-pointer"
        onClick={handleClick}
      >
        <BiLeftArrowAlt className="h-[25px] w-[25px] text-black" />
      </div>
      {src && <img src={src} alt="" className="h-[40px]" />}
      <h2 className="text-[13px] md:text-[15px]">
        {title && title}
        {sub?.title ? (
          <Link
            to={sub?.link}
            className="block text-left text-[12px] text-primary font-normal"
          >
            {sub?.title}
          </Link>
        ) : null}
      </h2>

      {icon && (
        <div
          className="cursor-pointer"
          onClick={() => {
            link && navigate(link);
          }}
        >
          <AiFillInfoCircle className="h-[20px] w-[20px] text-[#A098AE]" />
        </div>
      )}
    </div>
  );
};

export default Breadcrumb;
