import { OrderListPage } from '../orders/OrderListPage';

/** Print orders are normal orders (orderType 'print'), so this is the Orders
 *  page filtered to them — same drawer, rider assignment, status flow and
 *  timeline, plus the print job with downloadable files. */
export function PrintOrdersPage() {
  return <OrderListPage type="print" title="Print Orders" />;
}
