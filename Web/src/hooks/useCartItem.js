import { useState, useMemo, useCallback, useEffect } from 'react';
import useShoppingCart from './useShoppingCart';
import useProductImages from './useProductImages';

const useCartItem = (item) => {
  const { updateQuantity, removeFromCart } = useShoppingCart();
  const [updating, setUpdating] = useState(false);
  const { fetchProductImage, getProductImageUrl } = useProductImages();

  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const product = item?.product || item?.product_data || item?.productDetails || null;
  const productId = product?.id || product?._id || item?.productId || item?.id || item?.product_id || null;
  const quantity = item?.quantity ?? 0;

  const bestPrice = useMemo(() => {
    if (!product) return 0;
    const stats = product.priceStats;
    if (stats && typeof stats.minPrice === 'number') {
      return stats.minPrice;
    }
    const prices = Array.isArray(product.prices)
      ? product.prices.map(p => p.price).filter(p => typeof p === 'number')
      : [];
    return prices.length ? Math.min(...prices) : 0;
  }, [product]);

  const itemTotal = useMemo(() => {
    return (bestPrice || 0) * quantity;
  }, [bestPrice, quantity]);

  // Image handling (co-located logic per request)
  useEffect(() => {
    let isMounted = true;
    const loadImage = async () => {
      if (!product) {
        setImageUrl(null);
        setImageLoading(false);
        setImageError(false);
        return;
      }
      try {
        setImageLoading(true);
        setImageError(false);
        const cached = getProductImageUrl(product);
        if (cached) {
          if (isMounted) {
            setImageUrl(cached);
            setImageLoading(false);
          }
          return;
        }
        const fetched = await fetchProductImage(product);
        if (isMounted) {
          setImageUrl(fetched || null);
          setImageLoading(false);
        }
      } catch (e) {
        if (isMounted) {
          setImageError(true);
          setImageLoading(false);
        }
      }
    };
    loadImage();
    return () => { isMounted = false; };
  }, [product, fetchProductImage, getProductImageUrl]);

  const displayName = product?.name || product?.product_name || item?.name || 'מוצר לא זמין';
  const displayBrand = product?.brand || item?.brand || 'מותג לא ידוע';
  const displayCategory = product?.subcategory?.name || product?.category?.name || item?.category?.name || item?.subcategory?.name || 'קטגוריה';
  const isProductMissing = !product;

  const handleQuantityChange = useCallback(async (newQuantity) => {
    if (!productId) return;
    setUpdating(true);
    try {
      await updateQuantity(productId, newQuantity);
    } finally {
      setUpdating(false);
    }
  }, [productId, updateQuantity]);

  const handleRemove = useCallback(async () => {
    if (!productId) return;
    setUpdating(true);
    try {
      await removeFromCart(productId);
    } finally {
      setUpdating(false);
    }
  }, [productId, removeFromCart]);

  return {
    product,
    productId,
    quantity,
    bestPrice,
    itemTotal,
    updating,
    handleQuantityChange,
    handleRemove,
    // image and display data
    imageUrl,
    imageLoading,
    imageError,
    setImageError,
    displayName,
    displayBrand,
    displayCategory,
    isProductMissing
  };
};

export default useCartItem;


