import { selectUserRole } from '@redux/reducers/auth/selector';
import Paths from '@routes/paths';
import UserRoles from '@routes/roles';
import React from 'react';
import { Helmet } from 'react-helmet';
import { useSelector } from 'react-redux';
import { Link } from 'react-router';

const ErrorPage: React.FC = () => {
  const userRole = useSelector(selectUserRole);

  let redirectTo;

  if (userRole === UserRoles.Staff) {
    redirectTo = Paths.Staff.dashboard;
  } else if (userRole === UserRoles.Admin) {
    redirectTo = Paths.Admin.dashboard;
  } else {
    redirectTo = Paths.signIn;
  }

  return (
    <>
      <Helmet>
        <title>KICKOFF SPORTS WEAR - Page Not Found</title>
      </Helmet>
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <h1>
          <span className="text-[30px] text-center">404</span> <br /> PAGE NOT
          FOUND
        </h1>
        <Link to={redirectTo} className="mt-3 text-primary">
          Back to Home
        </Link>
      </div>
    </>
  );
};

export default ErrorPage;
