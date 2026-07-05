import wishlistService from '../service/wishlist.service.js';

const wishlistSaveController = async (req, res, next) => {
  try {
    const user_id = req.user.id; // from verified JWT
    const { opportunity_id } = req.body;

    await wishlistService.saveWishlist({ user_id, opportunity_id });

    return res.status(201).json({
      success: true,
      message: 'Item added to wishlist successfully',
    });
  } catch (err) {
    next(err);
  }
};

const wishlistRemoveController = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { opportunity_id } = req.body;

    await wishlistService.deleteWishlist({ user_id, opportunity_id });

    return res.status(200).json({
      success: true,
      message: 'Item removed from wishlist successfully',
    });
  } catch (err) {
    next(err);
  }
};

const wishlistDisplayController = async (req, res, next) => {
  try {
    const user_id = req.user.id;

    const items = await wishlistService.getWishlist(user_id);

    return res.status(200).json({
      success: true,
      total: items.length,
      data: items,
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
