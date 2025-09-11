import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-2 mt-2">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p>&copy; {new Date().getFullYear()} MyCompany. All rights reserved.</p>
        <div className="mt-1 space-x-2">
          <a href="#" className="hover:text-gray-400">Privacy Policy</a>
          <a href="#" className="hover:text-gray-400">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
