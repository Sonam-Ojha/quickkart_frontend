import { OrderListPage } from '../orders/OrderListPage';

/** Food orders are normal orders (orderType 'food'), so this is the Orders
 *  page filtered to them — same drawer, rider assignment, status flow and
 *  timeline, plus the restaurant to call before confirming. */
export function FoodOrdersPage() {
  return <OrderListPage type="food" title="Food Orders" />;
}
