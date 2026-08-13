import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { ProductCard } from './ProductCard';

export default function ShopProducts() {
  const [params, setParams] = useSearchParams();
  const [meta, setMeta] = useState({ brands: [], categories: [] });
  const [rows, setRows] = useState([]);
  const [pageMeta, setPageMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const search = params.get('search') || '';
  const categoryName = params.get('category') || '';
  const brandId = params.get('brandId') || '';
  const sort = params.get('sort') || '';
  const page = Number(params.get('page') || 1);
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';

  const categoryId = useMemo(() => {
    if (!categoryName) return '';
    return meta.categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase())?.id || '';
  }, [categoryName, meta.categories]);

  useEffect(() => {
    api.get('/store/meta').then(({ data }) => setMeta(data.data || { brands: [], categories: [] })).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const query = {
      page,
      limit: 12,
      search: search || undefined,
      categoryId: categoryId || undefined,
      brandId: brandId || undefined,
      sort: sort || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
    };
    api.get('/store/products', { params: query })
      .then(({ data }) => {
        setRows(data.data || []);
        setPageMeta(data.meta);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, categoryId, brandId, sort, page, minPrice, maxPrice]);

  function patch(next) {
    const n = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => {
      if (v == null || v === '') n.delete(k);
      else n.set(k, String(v));
    });
    if (!('page' in next)) n.set('page', '1');
    setParams(n);
  }

  return (
    <div className="shop-listing">
      <div className="shop-breadcrumb">
        <Link to="/shop">Home</Link>
        <span>/</span>
        <span>Products</span>
        {categoryName && (
          <>
            <span>/</span>
            <span>{categoryName}</span>
          </>
        )}
      </div>

      <div className="shop-listing-layout">
        <aside className="shop-filters">
          <h3 className="brand-font">Filters</h3>

          <div className="shop-filter-group">
            <label>Category</label>
            <select
              className="select"
              value={categoryName}
              onChange={(e) => patch({ category: e.target.value })}
            >
              <option value="">All</option>
              {meta.categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="shop-filter-group">
            <label>Brand</label>
            <select
              className="select"
              value={brandId}
              onChange={(e) => patch({ brandId: e.target.value })}
            >
              <option value="">All</option>
              {meta.brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="shop-filter-group">
            <label>Price range</label>
            <div className="shop-price-row">
              <input
                className="input"
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => patch({ minPrice: e.target.value })}
              />
              <input
                className="input"
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => patch({ maxPrice: e.target.value })}
              />
            </div>
          </div>

          <button type="button" className="btn btn-ghost" onClick={() => setParams({})}>
            Clear filters
          </button>
        </aside>

        <div className="shop-listing-main">
          <div className="shop-listing-toolbar">
            <div>
              <h1 className="brand-font">{categoryName || 'All Products'}</h1>
              <p>{pageMeta ? `${pageMeta.total} results` : ' '}</p>
            </div>
            <select className="select" value={sort} onChange={(e) => patch({ sort: e.target.value })}>
              <option value="">Sort by: Latest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Name</option>
            </select>
          </div>

          {loading ? (
            <div className="loading">Loading products...</div>
          ) : rows.length === 0 ? (
            <div className="empty">No products match your filters.</div>
          ) : (
            <div className="shop-product-grid">
              {rows.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  badge={p.stock > 0 && p.stock <= 5 ? 'Low Stock' : i % 5 === 0 ? 'Best Seller' : null}
                />
              ))}
            </div>
          )}

          {pageMeta && pageMeta.pages > 1 && (
            <div className="shop-pagination">
              <button className="btn btn-ghost" disabled={page <= 1} onClick={() => patch({ page: page - 1 })}>
                Previous
              </button>
              <span>Page {page} of {pageMeta.pages}</span>
              <button
                className="btn btn-ghost"
                disabled={page >= pageMeta.pages}
                onClick={() => patch({ page: page + 1 })}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
