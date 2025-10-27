import { Request, Response } from 'express';
import { FavoriteRepositoryFactory } from '../../models/factories/FavoriteRepositoryFactory';

const favoriteRepo = FavoriteRepositoryFactory.create();

// POST /api/favorites - Agregar propiedad a favoritos
export const addToFavoritesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { propertyId } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Usuario no autenticado' }
      });
      return;
    }

    if (!propertyId) {
      res.status(400).json({
        success: false,
        error: { message: 'propertyId es requerido' }
      });
      return;
    }

    const favorite = await favoriteRepo.addFavorite(userId, propertyId);

    res.status(201).json({
      success: true,
      data: {
        favorite,
        message: 'Propiedad agregada a favoritos'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Error agregando a favoritos' }
    });
  }
};

// DELETE /api/favorites/:propertyId - Quitar propiedad de favoritos
export const removeFromFavoritesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { propertyId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Usuario no autenticado' }
      });
      return;
    }

    const success = await favoriteRepo.removeFavorite(userId, propertyId);
    
    if (!success) {
      res.status(404).json({
        success: false,
        error: { message: 'Propiedad no encontrada en favoritos' }
      });
      return;
    }

    res.json({
      success: true,
      data: {
        message: 'Propiedad removida de favoritos'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Error removiendo de favoritos' }
    });
  }
};

// GET /api/favorites - Obtener favoritos del usuario
export const getUserFavoritesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Usuario no autenticado' }
      });
      return;
    }

    const favorites = await favoriteRepo.getUserFavorites(userId);

    res.json({
      success: true,
      data: {
        favorites,
        total: favorites.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Error obteniendo favoritos' }
    });
  }
};

// GET /api/favorites/check/:propertyId - Verificar si una propiedad está en favoritos
export const checkFavoriteController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { propertyId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Usuario no autenticado' }
      });
      return;
    }

    const isFavorite = await favoriteRepo.isFavorite(userId, propertyId);

    res.json({
      success: true,
      data: {
        isFavorite,
        propertyId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Error verificando favorito' }
    });
  }
};

// POST /api/favorites/wishlists - Crear nueva wishlist
export const createWishlistController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { name, description, isPublic } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Usuario no autenticado' }
      });
      return;
    }

    if (!name) {
      res.status(400).json({
        success: false,
        error: { message: 'name es requerido' }
      });
      return;
    }

    const wishlist = await favoriteRepo.createWishlist(userId, {
      userId,
      name,
      description: description || '',
      isPublic: isPublic || false,
      propertyIds: []
    });

    res.status(201).json({
      success: true,
      data: {
        wishlist,
        message: 'Wishlist creada exitosamente'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Error creando wishlist' }
    });
  }
};

// GET /api/favorites/wishlists - Obtener wishlists del usuario
export const getUserWishlistsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Usuario no autenticado' }
      });
      return;
    }

    const wishlists = await favoriteRepo.getUserWishlists(userId);

    res.json({
      success: true,
      data: {
        wishlists,
        total: wishlists.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Error obteniendo wishlists' }
    });
  }
};

// GET /api/favorites/wishlists/public - Obtener wishlists públicas
export const getPublicWishlistsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const wishlists = await favoriteRepo.getPublicWishlists();

    res.json({
      success: true,
      data: {
        wishlists,
        total: wishlists.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Error obteniendo wishlists públicas' }
    });
  }
};

// GET /api/favorites/wishlists/:id - Obtener wishlist específica
export const getWishlistController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Usuario no autenticado' }
      });
      return;
    }

    const wishlist = await favoriteRepo.getWishlistById(id);

    if (!wishlist) {
      res.status(404).json({
        success: false,
        error: { message: 'Wishlist no encontrada' }
      });
      return;
    }

    // Verificar que el usuario sea el dueño o que sea pública
    if (wishlist.userId !== userId && !wishlist.isPublic) {
      res.status(403).json({
        success: false,
        error: { message: 'No tienes permisos para ver esta wishlist' }
      });
      return;
    }

    res.json({
      success: true,
      data: { wishlist }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Error obteniendo wishlist' }
    });
  }
};

// PUT /api/favorites/wishlists/:id - Actualizar wishlist
export const updateWishlistController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const updates = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Usuario no autenticado' }
      });
      return;
    }

    // Verificar que la wishlist pertenece al usuario
    const wishlist = await favoriteRepo.getWishlistById(id);
    if (!wishlist || wishlist.userId !== userId) {
      res.status(404).json({
        success: false,
        error: { message: 'Wishlist no encontrada' }
      });
      return;
    }

    const updatedWishlist = await favoriteRepo.updateWishlist(id, updates);
    
    if (!updatedWishlist) {
      res.status(404).json({
        success: false,
        error: { message: 'Error actualizando wishlist' }
      });
      return;
    }

    res.json({
      success: true,
      data: {
        wishlist: updatedWishlist,
        message: 'Wishlist actualizada exitosamente'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Error actualizando wishlist' }
    });
  }
};

// DELETE /api/favorites/wishlists/:id - Eliminar wishlist
export const deleteWishlistController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Usuario no autenticado' }
      });
      return;
    }

    // Verificar que la wishlist pertenece al usuario
    const wishlist = await favoriteRepo.getWishlistById(id);
    if (!wishlist || wishlist.userId !== userId) {
      res.status(404).json({
        success: false,
        error: { message: 'Wishlist no encontrada' }
      });
      return;
    }

    const success = await favoriteRepo.deleteWishlist(id);
    
    if (!success) {
      res.status(404).json({
        success: false,
        error: { message: 'Error eliminando wishlist' }
      });
      return;
    }

    res.json({
      success: true,
      data: {
        message: 'Wishlist eliminada exitosamente'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Error eliminando wishlist' }
    });
  }
};

// POST /api/favorites/wishlists/:id/properties - Agregar propiedad a wishlist
export const addPropertyToWishlistController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const { propertyId } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Usuario no autenticado' }
      });
      return;
    }

    if (!propertyId) {
      res.status(400).json({
        success: false,
        error: { message: 'propertyId es requerido' }
      });
      return;
    }

    // Verificar que la wishlist pertenece al usuario
    const wishlist = await favoriteRepo.getWishlistById(id);
    if (!wishlist || wishlist.userId !== userId) {
      res.status(404).json({
        success: false,
        error: { message: 'Wishlist no encontrada' }
      });
      return;
    }

    const success = await favoriteRepo.addToWishlist(id, propertyId);
    
    if (!success) {
      res.status(400).json({
        success: false,
        error: { message: 'Error agregando propiedad a wishlist' }
      });
      return;
    }

    res.json({
      success: true,
      data: {
        message: 'Propiedad agregada a wishlist exitosamente'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Error agregando propiedad a wishlist' }
    });
  }
};

// DELETE /api/favorites/wishlists/:id/properties/:propertyId - Quitar propiedad de wishlist
export const removePropertyFromWishlistController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { id, propertyId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Usuario no autenticado' }
      });
      return;
    }

    // Verificar que la wishlist pertenece al usuario
    const wishlist = await favoriteRepo.getWishlistById(id);
    if (!wishlist || wishlist.userId !== userId) {
      res.status(404).json({
        success: false,
        error: { message: 'Wishlist no encontrada' }
      });
      return;
    }

    const success = await favoriteRepo.removeFromWishlist(id, propertyId);
    
    if (!success) {
      res.status(400).json({
        success: false,
        error: { message: 'Error removiendo propiedad de wishlist' }
      });
      return;
    }

    res.json({
      success: true,
      data: {
        message: 'Propiedad removida de wishlist exitosamente'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Error removiendo propiedad de wishlist' }
    });
  }
};

// GET /api/favorites/stats - Obtener estadísticas de favoritos
export const getFavoriteStatsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Usuario no autenticado' }
      });
      return;
    }

    const favorites = await favoriteRepo.getUserFavorites(userId);
    const wishlists = await favoriteRepo.getUserWishlists(userId);
    const stats = await favoriteRepo.getFavoriteStats();

    res.json({
      success: true,
      data: {
        stats: {
          userFavorites: favorites.length,
          userWishlists: wishlists.length,
          ...stats
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Error obteniendo estadísticas' }
    });
  }
};
