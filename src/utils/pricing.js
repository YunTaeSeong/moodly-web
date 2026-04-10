/**
 * DB `products.price`는 실제 판매가(이미 할인 반영). `discount`%는 UI·배지용이며
 * 핫딜/특가 카드와 같이 취소선 정가만 역산할 때 사용한다.
 * 주문·장바구니·결제 소계는 price × 수량만 사용한다 (할인율 재적용 없음).
 */
export function displayListPriceFromSale(salePrice, discountPercent) {
  const sale = Number(salePrice);
  const pct =
    discountPercent == null || discountPercent === '' ? 0 : Number(discountPercent);
  if (!Number.isFinite(sale) || sale <= 0) return sale;
  if (!Number.isFinite(pct) || pct <= 0 || pct >= 100) return sale;
  return Math.round(sale / (1 - pct / 100));
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/** 주문/장바구니 한 줄: 판매 단가 × 수량 */
export function orderLineTotal(item) {
  const unit = Number(item.price);
  const qty = Number(item.quantity) || 1;
  if (!Number.isFinite(unit)) return 0;
  return round2(unit * qty);
}

export function orderSubtotalFromItems(items) {
  if (!items || !items.length) return 0;
  return round2(items.reduce((sum, it) => sum + orderLineTotal(it), 0));
}
