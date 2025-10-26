import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/profile/change-password
 * Maneja el cambio de contraseña desde el perfil del usuario
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validar datos requeridos
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Contraseña actual y nueva contraseña son requeridas' },
        { status: 400 }
      );
    }

    // Validar longitud de contraseña
    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Obtener token de autorización
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Token de autorización requerido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Llamar al backend real para cambiar la contraseña
    try {
      console.log('🔄 [ChangePassword] Llamando al backend real...');
      console.log('🔄 [ChangePassword] Token:', token ? '***' : 'undefined');
      console.log('🔄 [ChangePassword] Nueva contraseña:', newPassword ? '***' : 'undefined');
      
      const backendResponse = await fetch('http://localhost:5000/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      console.log('📥 [ChangePassword] Status del backend:', backendResponse.status);
      console.log('📥 [ChangePassword] Headers del backend:', Object.fromEntries(backendResponse.headers.entries()));

      const backendData = await backendResponse.json();
      console.log('📥 [ChangePassword] Respuesta del backend:', backendData);

      if (backendResponse.ok && backendData.success) {
        console.log('✅ [ChangePassword] Contraseña actualizada exitosamente en el backend');
        return NextResponse.json({
          success: true,
          message: 'Contraseña actualizada exitosamente'
        });
      } else {
        console.log('❌ [ChangePassword] Error del backend:', backendData);
        return NextResponse.json({
          success: false,
          message: backendData.message || 'Error al cambiar la contraseña en el backend'
        }, { status: 400 });
      }
    } catch (backendError) {
      console.error('💥 [ChangePassword] Error llamando al backend:', backendError);
      return NextResponse.json({
        success: false,
        message: 'Error de conexión con el servidor'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('💥 [ChangePassword] Error procesando request:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
