import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../interfaces/product';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cartItems: Product[] = [];
  private cartItemsSubject = new BehaviorSubject<Product[]>([]);
  cartItems$ = this.cartItemsSubject.asObservable();

  /* Fix here */
  addToCart(product: Product): void {
    const existingProductIndex = this.cartItems.findIndex(
      (item) => 
        item.productos.id_producto === product.productos.id_producto && 
        item.id_talleSeleccionado === product.id_talleSeleccionado
    );

    if (existingProductIndex === -1) {
      this.cartItems.push({...product});
      this.updateStock(product, -product.cantidad);
    } else {
      this.cartItems[existingProductIndex].cantidad += product.cantidad;
      this.updateStock(this.cartItems[existingProductIndex], -product.cantidad);
    }
    
    this.cartItemsSubject.next([...this.cartItems]);
  }

  removeFromCart(product: Product): void {
    const updatedItems = this.cartItems.filter(
      (item) => 
        !(item.productos.id_producto === product.productos.id_producto && 
          item.id_talleSeleccionado === product.id_talleSeleccionado)
    );
    
    const removedProduct = this.cartItems.find(
      (item) => 
        item.productos.id_producto === product.productos.id_producto && 
        item.id_talleSeleccionado === product.id_talleSeleccionado
    );
    
    if (removedProduct) {
      this.updateStock(removedProduct, removedProduct.cantidad);
    }
    
    this.setCartItems(updatedItems);
  }

  updateStock(product: Product, quantity: number): void {
    const productIndex = this.cartItems.findIndex(
      (item) => item.id_producto_talle === product.id_producto_talle
    );

    if (productIndex !== -1) {
      const sizeIndex = product.talles.findIndex(
        (talle) => talle.id_talle === product.id_talleSeleccionado /* Arreglar bug acá, se repite la selección de talle una vez que el talle está elegido y por ende la cantidad de productos a comprar de ESE talle elegido se aumenta en vez de aumentarse la cantidad del talle A ELEGIR después de elegir un primer talle */
      );

      if (sizeIndex !== -1) {
        product.talles[sizeIndex].stock += quantity;
      }
    }
  }

  isProductInCart(productId: number, size_id: number): boolean {
    return this.cartItems.some(
      (item) => item.productos.id_producto === productId && item.id_talleSeleccionado === size_id
    );
  }

  getCartItems(): Product[] {
    return this.cartItems;
  }

  setCartItems(cartItems: Product[]): void {
    this.cartItems = cartItems;
    this.cartItemsSubject.next(this.cartItems);
  }
}
