import { MenuEditor, MenuApi } from '../food/RestaurantMenuPage';
import { partnerApi } from './api';

// Module-level so the editor loads once (it reloads when menuApi changes).
const partnerMenuApi: MenuApi = {
  getMenu:        partnerApi.menu,
  createCategory: partnerApi.createCategory,
  updateCategory: partnerApi.updateCategory,
  removeCategory: partnerApi.removeCategory,
  createItem:     partnerApi.createItem,
  updateItem:     partnerApi.updateItem,
  toggleItem:     partnerApi.toggleItem,
  removeItem:     partnerApi.removeItem,
  upload:         partnerApi.upload,
};

/** The restaurant's own menu — same editor as the admin, scoped by the partner API. */
export function PartnerMenuPage() {
  return (
    <MenuEditor
      menuApi={partnerMenuApi}
      canEdit
      header={({ items, soldOut }) => (
        <div className="mb-4">
          <h1 className="text-xl font-bold text-slate-900">Menu</h1>
          <p className="text-sm text-slate-500">
            {items} items{soldOut ? ` · ${soldOut} sold out` : ''} · changes show in the app straight away
          </p>
        </div>
      )}
    />
  );
}
