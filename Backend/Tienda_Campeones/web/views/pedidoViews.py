from datetime import datetime
from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from django.db.models import Sum
from web.Serializers.pedidos_serializers import *
from web.models import *
import mercadopago


# Configuración de Mercado Pago


class PedidosViewSet(viewsets.ModelViewSet):
    queryset = Pedidos.objects.all()
    serializer_class = PedidosSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['list','retrieve']:
          return PedidosListSerializer
        return self.serializer_class
    
    def get_queryset(self):
         user = self.request.user
         if user.is_authenticated:
          if user.rol == 'ADMIN':
            return Pedidos.objects.all() 
          elif user.rol == 'CLIENTE':
            return Pedidos.objects.filter(id_usuario=user.id_usuario)
    # Si el usuario no esta autenticado devuelvo un queryset vacio
         return Pedidos.objects.none()
         
    
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    
    
    
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance is None:
            return Response({'Mensaje': 'Lo sentimos, no se encontro un pedido con esa informacion.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Pasar la instancia al serializer
        serializer = CancelarPedidoSerializer(instance)
        result=serializer.delete(instance)
        
        if result is None:
            return Response({'Mensaje': 'El pedido ya se encontraba cancelado.'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({'Mensaje': 'Pedido cancelado correctamente.'}, status=status.HTTP_200_OK)
    
    
    # Metodo para marcar el pedido como enviado
    @action(detail=True, methods=['get'])
    def enviar(self, request, pk=None):
        instance = self.get_object()
        user =self.request.user
        if user.rol == 'ADMIN':
         if instance.estado == 'ENVIADO':
            return Response({'mensaje': 'Este pedido ya ha sido enviado.'}, status=status.HTTP_400_BAD_REQUEST)
         elif instance.estado == 'CANCELADO':
             return Response({'mensaje': 'El pedido esta cancelado,no puede enviarse.'}, status=status.HTTP_400_BAD_REQUEST)
         instance.estado = 'ENVIADO'
         instance.save()
         return Response({'message': 'Pedido marcado como enviado.'}, status=status.HTTP_200_OK)
        else:
            return Response({'mensaje': 'No tienes permisos para enviar pedidos.'}, status=status.HTTP_403_FORBIDDEN)
        
       

    
    @action(detail=False, methods=['get'])   
    def listar_metodopago(self, request):  
     formas_de_pago = FormasDePago.objects.all()
    
    # Obtener todas las tarjetas
     tarjetas = Tarjetas.objects.all()
     formas_de_pago_serializer = MetodoPagoListSerializer(formas_de_pago, many=True)
     tarjetas_serializer = TarjetaSerializer(tarjetas, many=True)
    
    # Combino los resultados en un diccionario
     data = {
        'formas_de_pago': formas_de_pago_serializer.data,
        'tarjetas': tarjetas_serializer.data
    }
     return Response(data, status=status.HTTP_200_OK)
 
 
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def calcular_ventas(self, request):
        if not request.user.is_staff:
            return Response({'mensaje': 'No tienes permisos suficientes para realizar esta operacion.'}, status=status.HTTP_403_FORBIDDEN)

        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')

        if not fecha_inicio or not fecha_fin:
            return Response({'mensaje': 'Por favor, proporcione las fechas de inicio y finalización.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            fecha_inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
            fecha_fin = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
        except ValueError:
            return Response({'mensaje': 'Formato de fecha no válido. Use AAAA-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        pedidos = Pedidos.objects.filter(estado='ENVIADO', fecha__range=[fecha_inicio, fecha_fin])
        total_ventas = pedidos.aggregate(total=Sum('total'))['total']

        return Response({'total_ventas': total_ventas}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def procesar_pago_mercadopago(self, request, pk=None):
        try:
            pedido = self.get_object()
            
            # Se verifica si el pedido ya tiene una forma de pago
            if FormasDepagoPedidos.objects.filter(id_pedido=pedido).exists():
                return Response({
                    "error": "El pedido ya tiene una forma de pago asociada"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Se verifica que el total sea válido
            if not pedido.total or pedido.total <= 0:
                return Response({
                    "error": "El total del pedido debe ser mayor a 0"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Se configura Mercado Pago
            sdk = mercadopago.SDK(MERCADOPAGO_ACCESS_TOKEN)
            
            # Se crea la preferencia de pago
            preference_data = {
                "items": [
                    {
                        "id": str(pedido.id_pedido),
                        "title": f"Pedido #{pedido.id_pedido}",
                        "quantity": 1,
                        "currency_id": "ARS",
                        "unit_price": float(pedido.total)
                    }
                ],
                "payer": {
                    "name": "Test User",
                    "email": "test@test.com"
                },
                "external_reference": str(pedido.id_pedido),
                "payment_methods": {
                    "excluded_payment_types": [],
                    "installments": 1
                },
                "statement_descriptor": "TIENDA CAMPEONES",
                "binary_mode": True
            }
            
            try:
                preference_response = sdk.preference().create(preference_data)
            except Exception as e:
                return Response({
                    "error": f"Error al crear preferencia: {str(e)}"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not preference_response:
                return Response({
                    "error": "No se recibió respuesta de Mercado Pago"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if "response" not in preference_response:
                return Response({
                    "error": "Error al crear la preferencia de pago"
                }, status=status.HTTP_400_BAD_REQUEST)
                
            preference = preference_response["response"]
            
            if not isinstance(preference, dict):
                return Response({
                    "error": "Formato de respuesta inválido de Mercado Pago"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            required_fields = ["init_point", "id"]
            missing_fields = [field for field in required_fields if field not in preference]
            
            if missing_fields:
                return Response({
                    "error": f"La preferencia de pago no contiene los campos necesarios: {', '.join(missing_fields)}"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                forma_pago = FormasDePago.objects.get(descripcion='Mercado Pago')
                
                FormasDepagoPedidos.objects.create(
                    id_pedido=pedido,
                    id_forma_de_pago=forma_pago
                )
            except FormasDePago.DoesNotExist:
                return Response({
                    "error": "No se encontró la forma de pago Mercado Pago"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            init_point = preference.get("init_point")
            if not init_point:
                return Response({
                    "error": "No se encontró el punto de inicio de pago"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({
                "init_point": init_point,
                "preference_id": preference["id"]
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
