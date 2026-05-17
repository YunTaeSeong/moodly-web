/** DB category_id ↔ 프론트 라우트 경로 (/category/:id) */
export const CATEGORY_ROUTE_BY_BACKEND_ID = {
  1: 'clothing',
  2: 'electronics',
  3: 'food',
  4: 'beauty',
  5: 'home-interior',
};

export const BACKEND_ID_BY_ROUTE = {
  clothing: 1,
  electronics: 2,
  food: 3,
  beauty: 4,
  'home-interior': 5,
  home: 5,
};

/**
 * API 숫자 ID(2) 또는 라우트 문자열('electronics') → 라우트 경로
 */
export function resolveCategoryRoutePath(categoryId) {
  if (categoryId == null || categoryId === '') return null;

  const raw = String(categoryId).trim();
  if (BACKEND_ID_BY_ROUTE[raw] != null) {
    return raw === 'home' ? 'home-interior' : raw;
  }

  const n = Number(raw);
  if (Number.isFinite(n) && CATEGORY_ROUTE_BY_BACKEND_ID[n]) {
    return CATEGORY_ROUTE_BY_BACKEND_ID[n];
  }

  return null;
}

export function resolveBackendCategoryId(routeOrBackendId) {
  if (routeOrBackendId == null || routeOrBackendId === '') return null;

  const raw = String(routeOrBackendId).trim();
  if (BACKEND_ID_BY_ROUTE[raw] != null) {
    return BACKEND_ID_BY_ROUTE[raw];
  }

  const n = Number(raw);
  if (Number.isFinite(n) && CATEGORY_ROUTE_BY_BACKEND_ID[n]) {
    return n;
  }

  return null;
}
