export function cartAddedMessage(productName: string, isOffline: boolean): string {
  if (isOffline) {
    return `${productName} — saved to cart on this device. Will sync when you are back online.`;
  }
  return productName;
}

export function favouriteMessage(productName: string, added: boolean, isOffline: boolean): string {
  if (added && isOffline) {
    return `${productName} — saved to favourites. Will sync when you are back online.`;
  }
  if (added) return productName;
  return productName;
}

export function movedToCartMessage(productName: string, isOffline: boolean): string {
  if (isOffline) {
    return `${productName} moved to cart. Will sync when you are back online.`;
  }
  return `${productName} moved to cart.`;
}
