/** Resolve historical PostHog identifiers from the CURRENT approved public catalogue.
 * The Website intentionally reports only stable keys, never arbitrary product text.
 * This Owner-only API enriches the aggregate response without changing event history.
 */
const MAX_RESPONSE_BYTES = 8_000_000;
const PAGE_SIZE = 1000;
const MAX_PAGES = 10;
const validName = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 160;
const validKey = value => typeof value === 'string' && value.length > 0 && value.length <= 120;

async function readCatalogPage(origin, page, transport) {
  const response = await transport(origin + '/v1/public/catalog?page=' + page + '&limit=' + PAGE_SIZE, {
    method: 'GET', redirect: 'manual', cache: 'no-store',
    headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000),
  });
  if (response.status !== 200 || !response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('public_catalog_unavailable');
  }
  const length = Number(response.headers.get('content-length') || 0);
  if (length > MAX_RESPONSE_BYTES) throw new Error('public_catalog_oversized');
  const body = await response.arrayBuffer();
  if (body.byteLength > MAX_RESPONSE_BYTES) throw new Error('public_catalog_oversized');
  const parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body));
  if (!parsed || typeof parsed !== 'object' || !parsed.data ||
      !Array.isArray(parsed.data.categories) || !Array.isArray(parsed.data.products) ||
      parsed.data.categories.length > 2000 || parsed.data.products.length > PAGE_SIZE ||
      !Number.isSafeInteger(parsed.pagination?.totalPages) ||
      parsed.pagination.totalPages < 1 || parsed.pagination.totalPages > MAX_PAGES ||
      parsed.pagination.page !== page || parsed.pagination.limit !== PAGE_SIZE) {
    throw new Error('public_catalog_invalid');
  }
  return parsed;
}

export async function attachCatalogNames(statistics, origin, transport = fetch) {
  if (!statistics.products.length && !statistics.categories.length) return statistics;
  const uri = new URL(origin);
  if (uri.protocol !== 'https:' || uri.pathname !== '/' || uri.search || uri.hash ||
      uri.username || uri.password || uri.port) throw new Error('public_catalog_origin_invalid');
  const products = new Map(), categories = new Map();
  const wantedProducts = new Set(statistics.products.map(x => x.label));
  const wantedCategories = new Set(statistics.categories.map(x => x.label));
  let totalPages = 1;
  for (let page = 1; page <= totalPages; page++) {
    const snapshot = await readCatalogPage(uri.origin, page, transport);
    totalPages = snapshot.pagination.totalPages;
    for (const category of snapshot.data.categories) {
      if (!validName(category?.name)) continue;
      for (const key of [category.slug, category.id]) {
        if (validKey(key) && wantedCategories.has(key)) categories.set(key, category.name.trim());
      }
    }
    for (const product of snapshot.data.products) {
      if (!validName(product?.name)) continue;
      const keys = [product.slug, product.id,
        ...(Array.isArray(product.legacySlugs) && product.legacySlugs.length <= 100 ? product.legacySlugs : []),
      ];
      for (const key of keys) {
        if (validKey(key) && wantedProducts.has(key)) products.set(key, product.name.trim());
      }
    }
    if ([...wantedProducts].every(k => products.has(k)) &&
        [...wantedCategories].every(k => categories.has(k))) break;
  }
  return {
    ...statistics,
    products: statistics.products.map(item => ({ ...item,
      label: products.get(item.label) || 'Không tìm thấy tên sản phẩm (' + item.label + ')',
    })),
    categories: statistics.categories.map(item => ({ ...item,
      label: categories.get(item.label) || (item.label === 'chua-phan-loai'
        ? 'Chưa phân loại' : 'Danh mục chưa xác định (' + item.label + ')'),
    })),
    labelsUnavailable: false,
  };
}
