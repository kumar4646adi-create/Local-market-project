import React, { useState } from 'react';
import { Order } from '../types';
import { addStoreReview, updateRetailerProfile } from '../services/firebaseService';

interface StoreReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onReviewSubmitted?: () => void;
}

export const StoreReviewModal: React.FC<StoreReviewModalProps> = ({
  isOpen,
  onClose,
  order,
  onReviewSubmitted
}) => {
  const [rating, setRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Order Experience',
    'Store Service',
    'Product Availability'
  ]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTags = [
    'Order Experience',
    'Store Service',
    'Product Availability',
    'Pickup Experience',
    'Fast Preparation',
    'Fresh Stock',
    'Friendly Merchant'
  ];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addStoreReview({
        retailerId: order.retailerId,
        orderId: order.id,
        customerId: order.customerId,
        customerName: order.customerName,
        rating,
        tags: selectedTags,
        comment: comment.trim()
      });

      onReviewSubmitted?.();
      onClose();
    } catch (err: any) {
      alert(`Failed to submit review: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden z-10 animate-in fade-in zoom-in-95">
        <div className="p-5 border-b border-outline-variant/20 bg-surface-container-low flex items-center justify-between">
          <div>
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Rate Your Experience
            </h3>
            <p className="font-body-sm text-xs text-on-surface-variant">
              {order.retailerName} • Order {order.orderNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Star Rating */}
          <div className="text-center space-y-1">
            <span className="text-xs uppercase font-bold text-on-surface-variant tracking-wider">
              Overall Rating
            </span>
            <div className="flex items-center justify-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 text-amber-500 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[36px]">
                    {star <= rating ? 'star' : 'star_border'}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-sm font-bold text-on-surface">
              {rating === 5 && 'Outstanding Experience! ⭐⭐⭐⭐⭐'}
              {rating === 4 && 'Very Good Service! ⭐⭐⭐⭐'}
              {rating === 3 && 'Average Experience ⭐⭐⭐'}
              {rating === 2 && 'Needs Improvement ⭐⭐'}
              {rating === 1 && 'Unsatisfactory ⭐'}
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-bold text-on-surface-variant tracking-wider">
              What did you like most?
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-secondary text-on-secondary shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-outline-variant/30'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Written Feedback */}
          <div>
            <label className="block text-xs uppercase font-bold text-on-surface-variant tracking-wider mb-1">
              Optional Written Review
            </label>
            <textarea
              rows={3}
              placeholder="Tell other local customers about the product freshness, packaging, and pickup speed..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-sm text-body-sm focus:outline-none focus:border-secondary"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-neutral-800 transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Submitting...' : 'Post Store Review'}
          </button>
        </form>
      </div>
    </div>
  );
};
