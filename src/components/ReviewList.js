'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { StarIcon } from '@heroicons/react/20/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { PencilIcon } from '@heroicons/react/24/outline';
import ChipInput from '@/components/ChipInput';

export default function ReviewList({ reviews: initialReviews, toolId }) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState(initialReviews || []);
  const [userReview, setUserReview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    comment: '',
    pros: [],
    cons: []
  });



  // Fetch reviews on mount and when toolId changes
  useEffect(() => {
    if (toolId) {
      fetchReviews();
    }
  }, [toolId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reviews?toolId=${toolId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Find user's most recent review
    if (session && reviews.length > 0) {
      const userReviews = reviews
        .filter(review => {
          // Handle different user ID formats (ObjectId vs string)
          const userId = review.userId?._id || review.userId;
          return userId?.toString() === session.user.id.toString();
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      const mostRecentReview = userReviews[0];
      if (mostRecentReview) {
        setUserReview(mostRecentReview);
        setFormData({
          rating: 5, // Always start with 5 stars for new reviews
          comment: '',
          pros: [],
          cons: []
        });
      } else {
        setUserReview(null);
        setFormData({ rating: 5, comment: '', pros: [], cons: [] });
      }
    }
  }, [session, reviews]);



  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!session) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId,
          rating: formData.rating,
          comment: formData.comment,
          pros: formData.pros || [],
          cons: formData.cons || []
        })
      });

      if (response.ok) {
        const data = await response.json();
        await fetchReviews(); // Refresh reviews
        // Clear the form for next review
        setFormData({ rating: 5, comment: '', pros: [], cons: [] });
        setShowReviewForm(false);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };



  const visibleReviews = reviews.filter(review => review.status === 'visible');
  
  // Calculate dynamic ratings from current reviews
  const activeRatings = visibleReviews.filter(review => 
    review.isRatingActive && 
    review.rating != null && 
    review.rating !== undefined
  );
  
  // Ensure rating values are numbers for proper calculation
  const dynamicAverageRating = activeRatings.length > 0 
    ? activeRatings.reduce((sum, r) => sum + Number(r.rating), 0) / activeRatings.length 
    : 0;
  
  const dynamicTotalReviews = visibleReviews.length;

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-[#F5F5F5]">Customer Reviews</h3>
            <div className="flex items-center mt-4">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="cursor-help" title={`${dynamicAverageRating.toFixed(1)} out of 5 stars`}>
                    {star <= dynamicAverageRating ? (
                      <StarIcon className="h-8 w-8 text-yellow-400" />
                    ) : star - 0.5 <= dynamicAverageRating ? (
                      <div className="relative inline-block">
                        <StarOutlineIcon className="h-8 w-8 text-gray-400 absolute" />
                        <StarIcon className="h-8 w-8 text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />
                      </div>
                    ) : (
                      <StarOutlineIcon className="h-8 w-8 text-gray-400" />
                    )}
                  </span>
                ))}
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-[#F5F5F5] cursor-help" title={`Average rating: ${dynamicAverageRating.toFixed(1)}`}>
                  {dynamicAverageRating.toFixed(1)} out of 5
                </p>
                <p className="text-[#CFCFCF] cursor-help" title={`Total reviews: ${dynamicTotalReviews} | Active ratings: ${activeRatings.length}`}>
                  Based on {dynamicTotalReviews} {dynamicTotalReviews === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Form for Logged-in Users */}
      {session && (
        <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[#F5F5F5]">
              {userReview ? 'Add Another Review' : 'Write a Review'}
            </h3>
            {userReview && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="flex items-center gap-2 px-4 py-2 bg-[#00FFE0] hover:bg-[#00FFE0]/90 text-[#0A0F24] rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer hover:scale-105"
                title="Add another review"
              >
                <PencilIcon className="w-4 h-4" />
                Add Review
              </button>
            )}
          </div>

          {(!userReview || showReviewForm) && (
            <form onSubmit={handleSubmitReview} className="space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-[#F5F5F5] font-medium mb-3">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="focus:outline-none transition-all duration-200 cursor-pointer hover:scale-110"
                      title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                      {star <= formData.rating ? (
                        <StarIcon className="h-8 w-8 text-yellow-400" />
                      ) : (
                        <StarOutlineIcon className="h-8 w-8 text-gray-400 hover:text-yellow-400" />
                      )}
                    </button>
                  ))}
                  <span className="ml-3 text-[#CFCFCF] font-medium cursor-help" title={`Current rating: ${formData.rating}/5`}>{formData.rating}/5</span>
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-[#F5F5F5] font-medium mb-3">Review</label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  required
                  rows="4"
                  className="w-full p-4 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-lg text-[#F5F5F5] placeholder-[#CFCFCF] focus:border-[#00FFE0] focus:outline-none transition-all duration-200 cursor-text"
                  placeholder="Share your experience with this tool..."
                />
              </div>

              {/* Pros and Cons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ChipInput
                  label="Pros (optional)"
                  value={formData.pros}
                  onChange={(value) => setFormData({ ...formData, pros: value })}
                  placeholder="What you liked about this tool"
                  helperText="Add positive aspects and press Enter or comma"
                />
                <ChipInput
                  label="Cons (optional)"
                  value={formData.cons}
                  onChange={(value) => setFormData({ ...formData, cons: value })}
                  placeholder="What could be improved"
                  helperText="Add areas for improvement and press Enter or comma"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-3 bg-[#00FFE0] text-[#0A0F24] rounded-lg hover:bg-[#00FFE0]/90 transition-all duration-200 font-semibold ${
                    isSubmitting 
                      ? 'cursor-wait opacity-70' 
                      : 'cursor-pointer hover:scale-105'
                  }`}
                  title={isSubmitting ? 'Submitting your review...' : 'Submit your new review'}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
                {userReview && showReviewForm && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowReviewForm(false);
                      setFormData({
                        rating: 5,
                        comment: '',
                        pros: [],
                        cons: []
                      });
                    }}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 cursor-pointer hover:scale-105"
                    title="Cancel adding review"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Show user's reviews if not editing */}
          {userReview && !showReviewForm && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-[#F5F5F5] mb-4">Your Reviews</h4>
              {reviews
                .filter(review => {
                  if (!session) return false;
                  // Handle different user ID formats (ObjectId vs string)
                  const userId = review.userId?._id || review.userId;
                  return userId?.toString() === session.user.id.toString();
                })
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((review, index) => (
                  <div key={review._id} className="bg-[#0A0F24] rounded-xl p-6 border border-[#00FFE0]/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className="cursor-help" title={`Your rating: ${review.rating}/5`}>
                              {star <= review.rating ? (
                                <StarIcon className="h-6 w-6 text-yellow-400" />
                              ) : (
                                <StarOutlineIcon className="h-6 w-6 text-gray-400" />
                              )}
                            </span>
                          ))}
                        </div>
                        {/* Show "(updated in a later review)" tag for inactive ratings */}
                        {review.rating && !review.isRatingActive && (
                          <span className="ml-2 px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full border border-orange-500/30">
                            (updated in a later review)
                          </span>
                        )}
                        <span className="ml-3 text-[#CFCFCF] cursor-help" title={`Reviewed on ${new Date(review.createdAt).toLocaleDateString()}`}>
                          {new Date(review.createdAt).toLocaleDateString()}
                          {index === 0 && <span className="ml-2 text-[#00FFE0] text-xs">(Most Recent)</span>}
                        </span>
                      </div>
                    </div>
                    <p className="text-[#F5F5F5] text-lg mb-4 cursor-text select-text">{review.comment}</p>
                    
                    {/* Admin Reply */}
                    {review.reply && (
                      <div className="mt-4 p-4 bg-[#0A0F24] rounded-xl border border-[#00FFE0]/20">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[#00FFE0] text-sm font-medium cursor-help" title="Reply from admin">
                            {review.replyAuthor || 'Admin'} –
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border cursor-help ${
                            review.replyRole === 'admin' 
                              ? 'bg-[#B936F4]/20 text-[#B936F4] border-[#B936F4]/30'
                              : review.replyRole === 'manager'
                              ? 'bg-[#FF6B35]/20 text-[#FF6B35] border-[#FF6B35]/30'
                              : review.replyRole === 'writer'
                              ? 'bg-[#4ECDC4]/20 text-[#4ECDC4] border-[#4ECDC4]/30'
                              : 'bg-[#00FFE0]/20 text-[#00FFE0] border-[#00FFE0]/30'
                          }`} title={`Role: ${review.replyRole || 'admin'}`}>
                            {review.replyRole ? review.replyRole.charAt(0).toUpperCase() + review.replyRole.slice(1) : 'Admin'}
                          </span>
                        </div>
                        <p className="text-[#F5F5F5] cursor-text select-text">{review.reply}</p>
                      </div>
                    )}

                    {/* Pros/Cons for user review */}
                    {(review.pros?.length > 0 || review.cons?.length > 0) && (
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {review.pros?.length > 0 && (
                          <div className="bg-[#0A0F24] rounded-xl p-4 cursor-help" title="Positive aspects">
                            <h4 className="text-[#00FFE0] font-medium mb-2">Pros</h4>
                            <ul className="space-y-2">
                              {review.pros.map((pro, index) => (
                                <li key={index} className="flex items-center text-[#CFCFCF] cursor-text select-text">
                                  <span className="w-1.5 h-1.5 bg-[#00FFE0] rounded-full mr-2"></span>
                                  {pro}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {review.cons?.length > 0 && (
                          <div className="bg-[#0A0F24] rounded-xl p-4 cursor-help" title="Areas for improvement">
                            <h4 className="text-[#FF4D4D] font-medium mb-2">Cons</h4>
                            <ul className="space-y-2">
                              {review.cons.map((con, index) => (
                                <li key={index} className="flex items-center text-[#CFCFCF] cursor-text select-text">
                                  <span className="w-1.5 h-1.5 bg-[#FF4D4D] rounded-full mr-2"></span>
                                  {con}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              }
            </div>
          )}
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00FFE0] mx-auto"></div>
            <p className="text-[#CFCFCF] mt-2">Loading reviews...</p>
          </div>
        ) : visibleReviews.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">⭐</div>
            <p className="text-[#CFCFCF] text-lg">No reviews yet. Be the first to review this tool!</p>
          </div>
        ) : (
          visibleReviews.map((review) => (
            <div key={review._id} className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8 hover:border-[#00FFE0]/40 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="cursor-help" title={`Rating: ${review.rating}/5`}>
                        {star <= review.rating ? (
                          <StarIcon className="h-6 w-6 text-yellow-400" />
                        ) : (
                          <StarOutlineIcon className="h-6 w-6 text-gray-400" />
                        )}
                      </span>
                    ))}
                  </div>
                  {/* Show "(updated in a later review)" tag for inactive ratings */}
                  {review.rating && !review.isRatingActive && (
                    <span className="ml-2 px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full border border-orange-500/30">
                      (updated in a later review)
                    </span>
                  )}
                  <span className="ml-3 text-[#CFCFCF] cursor-help" title={`Review by ${review.userId?.name || 'Anonymous'} on ${new Date(review.createdAt).toLocaleDateString()}`}>
                    by {review.userId?.name || 'Anonymous'} • {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <p className="mt-4 text-[#F5F5F5] text-lg leading-relaxed cursor-text select-text">{review.comment}</p>

              {/* Admin Reply */}
              {review.reply && (
                <div className="mt-4 p-4 bg-[#0A0F24] rounded-xl border border-[#00FFE0]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[#00FFE0] text-sm font-medium cursor-help" title="Admin response">
                      {review.replyAuthor || 'Admin'} –
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border cursor-help ${
                      review.replyRole === 'admin' 
                        ? 'bg-[#B936F4]/20 text-[#B936F4] border-[#B936F4]/30'
                        : review.replyRole === 'manager'
                        ? 'bg-[#FF6B35]/20 text-[#FF6B35] border-[#FF6B35]/30'
                        : review.replyRole === 'writer'
                        ? 'bg-[#4ECDC4]/20 text-[#4ECDC4] border-[#4ECDC4]/30'
                        : 'bg-[#00FFE0]/20 text-[#00FFE0] border-[#00FFE0]/30'
                    }`} title={`Role: ${review.replyRole || 'admin'}`}>
                      {review.replyRole ? review.replyRole.charAt(0).toUpperCase() + review.replyRole.slice(1) : 'Admin'}
                    </span>
                  </div>
                  <p className="text-[#F5F5F5] cursor-text select-text">{review.reply}</p>
                </div>
              )}

              {(review.pros?.length > 0 || review.cons?.length > 0) && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {review.pros?.length > 0 && (
                    <div className="bg-[#0A0F24] rounded-xl p-4 cursor-help" title="Positive aspects">
                      <h4 className="text-[#00FFE0] font-medium mb-2">Pros</h4>
                      <ul className="space-y-2">
                        {review.pros.map((pro, index) => (
                          <li key={index} className="flex items-center text-[#CFCFCF] cursor-text select-text">
                            <span className="w-1.5 h-1.5 bg-[#00FFE0] rounded-full mr-2"></span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {review.cons?.length > 0 && (
                    <div className="bg-[#0A0F24] rounded-xl p-4 cursor-help" title="Areas for improvement">
                      <h4 className="text-[#FF4D4D] font-medium mb-2">Cons</h4>
                      <ul className="space-y-2">
                        {review.cons.map((con, index) => (
                          <li key={index} className="flex items-center text-[#CFCFCF] cursor-text select-text">
                            <span className="w-1.5 h-1.5 bg-[#FF4D4D] rounded-full mr-2"></span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>


    </div>
  );
} 
