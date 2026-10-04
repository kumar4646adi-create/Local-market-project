import React, { useState } from 'react';
import { SKUItem } from '../types';

interface CatalogManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeName: string;
  catalog: SKUItem[];
  onUpdateSku: (skuId: string, updatedPrice: number, inStock: boolean) => void;
}

export const CatalogManifestModal: React.FC<CatalogManifestModalProps> = ({
  isOpen,
  onClose,
  storeName,
  catalog,
  onUpdateSku
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredItems = catalog.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadCsv = () => {
    const headers = ['SKU ID', 'Item Name', 'Category', 'Price (INR)', 'Unit', 'Stock Status', 'Shelf Life', 'Description'];
    const rows = catalog.map((item) => [
      item.id,
      `"${item.name.replace(/"/g, '""')}"`,
      item.category,
      item.price,
      item.unit,
      item.stockStatus,
      `"${item.shelfLife}"`,
      `"${item.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${storeName.replace(/\s+/g, '_')}_Catalog_Manifest.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[24px] text-primary">inventory_2</span>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Starter Catalog Manifest & Inventory Audit
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {storeName} • {catalog.length} SKUs Verified
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-label-sm text-label-sm font-semibold transition"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-outline-variant/20 bg-surface-container-lowest flex items-center gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search SKUs by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm border border-outline-variant/30 focus:outline-none"
            />
          </div>
        </div>

        {/* Table Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <table className="w-full text-left font-body-sm text-body-sm">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                <th className="py-2.5 px-4 rounded-l-lg">Item Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Shelf Life</th>
                <th className="py-2.5 px-3">Price / Unit</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-4 rounded-r-lg text-right">Quick Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-surface-container-low/50">
                  <td className="py-3 px-4">
                    <p className="font-label-md text-label-md font-bold text-on-surface">{item.name}</p>
                    <p className="text-on-surface-variant text-[11px] truncate max-w-xs">{item.description}</p>
                  </td>
                  <td className="py-3 px-3 text-on-surface-variant font-medium">{item.category}</td>
                  <td className="py-3 px-3 text-on-surface-variant text-[12px]">{item.shelfLife}</td>
                  <td className="py-3 px-3 font-bold text-on-surface">
                    ₹{item.price} / {item.unit}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.stockStatus === 'IN STOCK'
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'bg-error-container text-on-error-container'
                      }`}
                    >
                      {item.stockStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() =>
                        onUpdateSku(
                          item.id,
                          item.price,
                          item.stockStatus !== 'IN STOCK'
                        )
                      }
                      className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-[11px] font-semibold transition"
                    >
                      {item.stockStatus === 'IN STOCK' ? 'Mark Out of Stock' : 'Mark In Stock'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-outline-variant/30 flex items-center justify-between bg-surface-container-low text-on-surface-variant font-body-sm text-body-sm">
          <span>{filteredItems.length} items shown</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-neutral-800 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
