export interface MercadoPagoPaymentData {
  id_pedido: number;
  total: number;
}

export interface MercadoPagoResponse {
  init_point: string;
  preference_id: string;
}
