import { TApartments, TOptionalFees } from '@/lib/types/airbnb';

export const usePrice = (
  post: TApartments,
  reservationType: 'normal' | 'party' | 'movie' | 'photo',
  selectedBedrooms?: number | null
): number => {
  let basePrice = 0;
  
  // First, get the base price based on reservation type
  if (reservationType === "normal") {
    basePrice = post.defaultStayFee || 0;
  } else {
    // Map reservationType to the corresponding key in optionalFees
    const optionalFeeKey = {
      party: 'partyFee',
      movie: 'movieShootFee',
      photo: 'photoShootFee',
    }[reservationType] as keyof TOptionalFees;

    basePrice = post.optionalFees?.[optionalFeeKey] || post.defaultStayFee || 0;
  }
  
  // Bedroom pricing ONLY applies to "normal" reservations (matches backend logic)
  // For non-normal reservations (party, photo, movie), bedroom pricing is ignored
  if (reservationType === "normal" && selectedBedrooms !== null && selectedBedrooms !== undefined) {
    // If bedroom pricing is configured and selectedBedrooms is provided, use bedroom pricing
    if (post.bedroomPricing && post.bedroomPricing.length > 0) {
      // Find active bedroom pricing for the selected number of bedrooms
      const bedroomPricing = post.bedroomPricing.find(bp => 
        bp.bedrooms === selectedBedrooms && bp.isActive
      );
      
      if (bedroomPricing) {
        // Use bedroom-specific price directly (matches backend getBedroomPrice logic)
        return Math.round(bedroomPricing.price);
      }
    }
    // If no bedroom pricing found for selectedBedrooms, fall back to defaultStayFee
    // This matches backend behavior: if bedroom pricing not found, use base price
  }
  
  // For non-normal reservations OR when selectedBedrooms is null/undefined, use base price
  // This matches backend: bedroom pricing only for normal reservations
  return Math.round(basePrice);
};

