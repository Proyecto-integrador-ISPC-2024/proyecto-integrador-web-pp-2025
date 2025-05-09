
from rest_framework.response import Response
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import permissions as permission
from users.models import Usuarios
from users.usuarioapi.usuario_serializers import *

class Login(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permission.AllowAny]

    def post(self,request,*args, **kwargs):
        email = request.data.get('email', '')
        password = request.data.get('password', '')

        if not email or not password:
            return Response({'error': 'Campos obligatorios'}, status=status.HTTP_400_BAD_REQUEST)
        
        usuario =authenticate(email=email,
                           password=password)
        if usuario:
            login_serializer = self.serializer_class(data=request.data)
            if login_serializer.is_valid():
                usuario_serializer = UserSerializer(usuario)
                return Response({
                    'token': login_serializer.validated_data.get('access'),
                    'refresh_token': login_serializer.validated_data.get('refresh'),
                    'usuario': usuario_serializer.data,
                    'message': 'Inicio de sesión exitoso'
                }, status=status.HTTP_200_OK)
        
        return Response({'error': 'Mail o contraseña incorrectos'}, status=status.HTTP_400_BAD_REQUEST)
    
class Logout(GenericAPIView):
    
     def post(self,request,*args,**kwargs):
        email = request.data.get('email', '')
        usuario = Usuarios.objects.filter(email=email).first()
        if usuario is not None:
            RefreshToken.for_user(usuario)
            return Response({'message':'Sesion cerrada correctamente'},status=status.HTTP_200_OK)
        return Response({'error': 'No existe este mail'},status=status.HTTP_400_BAD_REQUEST)
    
    
#formulario de contacto
import logging
from django.core.mail import EmailMessage
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt

# Configurar el objeto logger para registrar mensajes de log
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

#se configuran decoradores para evitar problemas con el csrf, ya que django protge las solicitudes POST para evitar ataques CSRF 
@csrf_exempt
@api_view(['POST']) # Se especifica que la vista solo acepta solicitudes POST (decorador de Django REST Framework)
@permission_classes([AllowAny])

#defino la vista para el formulario de contacto
def contact_form_view(request):
    try:
        # Validación de campos requeridos
        data = request.data
        required_fields = {
            'name': 'Nombre',
            'lastName': 'Apellido',
            'email': 'Email',
            'message': 'Mensaje'
        }
        
        # Comprobar campos faltantes
        missing_fields = [name for field, name in required_fields.items() if field not in data or not data[field].strip()]
        if missing_fields:
            return Response(
                {'error': f'Faltan campos requeridos: {", ".join(missing_fields)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar formato de email
        email = data['email']
        if '@' not in email or '.' not in email.split('@')[-1]:
            return Response(
                {'error': 'Por favor ingrese un email válido'},
                status=status.HTTP_400_BAD_REQUEST
            )
         
        # Crear email
        contact_email = EmailMessage(
            subject='Consulta desde el formulario de contacto',
            body=(
                f"Nombre: {data['name']}\n"
                f"Apellido: {data['lastName']}\n"
                f"Email: {data['email']}\n"
                f"Mensaje: {data['message']}"
            ),
            from_email=settings.EMAIL_HOST_USER,
            to=[settings.EMAIL_HOST_USER],
            reply_to=[email],  
        )

        # Enviar email
        contact_email.send(fail_silently=False)

        return Response(
            {'success': 'Gracias por contactarnos. Te responderemos pronto.'},
            status=status.HTTP_200_OK
        )
    
    except Exception as e:
        logger.error(f"Error al enviar el formulario de contacto: {e}")
        return Response(
            {'error': 'Ocurrió un error al procesar tu mensaje. Por favor inténtalo nuevamente.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
