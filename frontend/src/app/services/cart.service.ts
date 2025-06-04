import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../interfaces/product';

@Injectable({ providedIn: 'root' })
export class CartService {
  /* --------------------  estado interno  -------------------- */
  private cartItems: Product[] = [];

  /* streams públicos */
  private cartItemsSubject = new BehaviorSubject<Product[]>([]);
  cartItems$ = this.cartItemsSubject.asObservable();

  private cartQuantitySubject = new BehaviorSubject<number>(0);
  cartQuantity$ = this.cartQuantitySubject.asObservable();

  /* --------------------  API pública  -------------------- */
  addToCart(product: Product): void {
    const idx = this.cartItems.findIndex(
      p => p.productos.id_producto === product.productos.id_producto &&
           p.id_talleSeleccionado === product.id_talleSeleccionado
    );

    if (idx === -1) {
      this.cartItems.push({ ...product });
      this.updateStock(product, -product.cantidad);
    } else {
      this.cartItems[idx].cantidad += product.cantidad;
      this.updateStock(this.cartItems[idx], -product.cantidad);
    }

    this.syncState();
  }

  removeFromCart(product: Product): void {
    const updated = this.cartItems.filter(
      p => !(p.productos.id_producto === product.productos.id_producto &&
             p.id_talleSeleccionado === product.id_talleSeleccionado)
    );

    const removed = this.cartItems.find(
      p => p.productos.id_producto === product.productos.id_producto &&
           p.id_talleSeleccionado === product.id_talleSeleccionado
    );
    if (removed) this.updateStock(removed, removed.cantidad);

    this.setCartItems(updated);
  }

  /* utilidades existentes, sin cambios de firma -------------- */
  updateStock(product: Product, quantity: number): void {
    const prodIdx = this.cartItems.findIndex(
      p => p.id_producto_talle === product.id_producto_talle
    );
    if (prodIdx !== -1) {
      const sizeIdx = product.talles.findIndex(
        t => t.id_talle === product.id_talleSeleccionado
      );
      if (sizeIdx !== -1) product.talles[sizeIdx].stock += quantity;
    }
  }

  isProductInCart(productId: number, sizeId: number): boolean {
    return this.cartItems.some(
      p => p.productos.id_producto === productId &&
           p.id_talleSeleccionado === sizeId
    );
  }

  getCartItems(): Product[] {
    return this.cartItems;
  }

  setCartItems(items: Product[]): void {
    this.cartItems = items;
    this.syncState();
  }

  /* --------------------  private helpers  -------------------- */
  /** Actualiza los dos subjects para mantener todo sincronizado */
  private syncState(): void {
    this.cartItemsSubject.next([...this.cartItems]);
    const totalQty = this.cartItems.reduce((acc, p) => acc + p.cantidad, 0);
    this.cartQuantitySubject.next(totalQty);
  }
}
