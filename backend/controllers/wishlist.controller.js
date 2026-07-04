import wishlistService from '../service/wishlist.service.js';

// save controller
const wishlistSaveController = async (req, res, next) => {
  try {
    // Data already validated by middleware
    const request = req.body;

    await wishlistService.saveWishlist(request);

    return res.status(201).json({
      success: true,
      message: 'Item added to wishlist successfully',
    });
  } catch (err) {
    next(err);
  }
};

// delete controller
const wishlistRemoveController = async (req, res, next) => {
  try {
    // Data already validated by middleware
    const request = req.body;

    await wishlistService.deleteWishlist(request);

    return res.status(200).json({
      success: true,
      message: 'Item removed from wishlist successfully',
    });
  } catch (err) {
    next(err);
  }
};

// display controller
const wishlistDisplayController = async (req, res, next) => {
  try {
    // Data already validated by middleware
    const request = req.body;

    const response = await wishlistService.displayWishlist(request);

    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found or failed to fetch details',
      });
    }

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

export default {
  wishlistSaveController,
  wishlistRemoveController,
  wishlistDisplayController,
};
