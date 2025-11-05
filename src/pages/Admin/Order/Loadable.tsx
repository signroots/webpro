/**
 *
 * Asynchronously loads the component for App
 *
 */

/* eslint-disable */
import loadable from '../../../utils/loadable';
import PageLoader from '../../../Common/PageLoader';

export default loadable(() => import('./index'), {
  fallback: <PageLoader />,
});
