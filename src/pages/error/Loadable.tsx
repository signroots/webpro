/**
 *
 * Asynchronously loads the component for App
 *
 */

/* eslint-disable */
import loadable from '@utils/loadable';
import PageLoader from '@components/Common/PageLoader';

export default loadable(() => import('./index'), {
  fallback: <PageLoader />,
});
