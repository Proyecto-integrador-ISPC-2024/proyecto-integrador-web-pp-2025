import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { ApiService } from '../../services/api.service';
import {
  MercadoPagoResponse,
  MercadoPagoPaymentData,
} from '../../interfaces/mercadopago';
import { Product } from '../../interfaces/product';
import { CartOrder } from '../../interfaces/cartOrder';
import { PaymentMethodData } from '../../interfaces/paymentMethodData';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-cart-resume',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf],
  templateUrl: './cart-resume.component.html',
  styleUrl: './cart-resume.component.css',
})
export class CartResumeComponent implements OnChanges {
  private ordersUrl = 'http://localhost:8000/pedidos/';
  @Input() cartResume: Product[] = [];
  @Input() totalPrice: number = 0;
  @Input() paymentMethods: PaymentMethodData = {
    formas_de_pago: [],
    tarjetas: [],
  };
  @Output() clearCartEvent = new EventEmitter<void>();
  @ViewChild('modalForm') modalForm!: ElementRef;

  isProcessingPayment = false;

  constructor(private authService: AuthService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cartResume']) {
      this.calculateTotalPrice();
    }
  }

  private calculateTotalPrice(): void {
    this.totalPrice = this.cartResume.reduce(
      (sum, product) => sum + product.productos.precio * product.cantidad,
      0
    );
  }

  formBuilder = inject(FormBuilder);
  apiService = inject(ApiService);
  renderer = inject(Renderer2);
  toastr = inject(ToastrService);

  formGroup = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    payment: ['', Validators.required],
    creditCards: [''],
    terms: [false, Validators.requiredTrue],
  });

  selectedPaymentMethod: number | null = null;
  selectedCreditCard: number | null = null;

  onPaymentChange(event: Event): void {
    const selectedPayment = (event.target as HTMLSelectElement).value;
    this.selectedPaymentMethod = parseInt(selectedPayment, 10);

    const creditCardControl = this.formGroup.get('creditCards');

    if (this.selectedPaymentMethod === 3) {
      creditCardControl?.setValidators([Validators.required]);
    } else {
      creditCardControl?.clearValidators();
    }
    creditCardControl?.updateValueAndValidity();
  }

  onCardSelectChange(event: Event): void {
    const selectedCard = (event.target as HTMLSelectElement).value;
    this.selectedCreditCard = parseInt(selectedCard, 10);
  }

  onEnviar(event: Event): void {
    event.preventDefault();
    if (this.formGroup.valid) {
      this.clickRegister();
    } else {
      this.formGroup.markAllAsTouched();
      this.toastr.warning(
        'Por favor, completá todos los campos.',
        'Formulario incompleto'
      );
    }
  }

  clickRegister(): void {
    const formValues = this.formGroup.value;

    if (this.formGroup.valid) {
      const mercadoPagoMethod = this.paymentMethods.formas_de_pago.find(
        (method) => method.descripcion === 'Mercado Pago'
      );

      if (this.selectedPaymentMethod === mercadoPagoMethod?.id_forma_de_pago) {
        this.processMercadoPagoPayment();
      } else {
        this.createOrder(formValues);
      }
    }
  }

  private processMercadoPagoPayment(): void {
    if (this.isProcessingPayment) return;
    this.isProcessingPayment = true;

    const userId = this.getUserId();
    const order: CartOrder = {
      id_usuario: userId,
      total: this.totalPrice,
      detalles: this.cartResume.map((product) => ({
        id_talle: product.id_talleSeleccionado,
        id_producto: product.productos.id_producto,
        cantidad: product.cantidad,
        subtotal: product.productos.precio * product.cantidad,
      })),
      forma_de_pago: [],
    };

    this.apiService.postWithAuth<CartOrder>(this.ordersUrl, order).subscribe({
      next: (createdOrder) => {
        const paymentUrl = `${this.ordersUrl}${createdOrder.id_pedido}/procesar_pago_mercadopago/`;
        const paymentData: MercadoPagoPaymentData = {
          id_pedido: createdOrder.id_pedido!,
          total: createdOrder.total,
        };
        this.apiService
          .postWithAuth<MercadoPagoResponse>(paymentUrl, paymentData)
          .subscribe({
            next: (response) => {
              window.location.href = response.init_point;
            },
            error: (error) => {
              this.isProcessingPayment = false;
              const errorMessage =
                error.error?.error ||
                'Error al procesar el pago con Mercado Pago';
              this.toastr.error(errorMessage, 'Error');
            },
          });
      },
      error: (error) => {
        this.isProcessingPayment = false;
        const errorMessage =
          error.error?.error || 'Hubo un error al crear el pedido.';
        this.toastr.error(errorMessage, 'Error');
      },
    });
  }

  getUserId(): number {
    const user = this.authService.getCurrentUser();
    return user?.id_usuario || 0;
  }

  createOrder(formValues: any): void {
    const userId = this.getUserId();
    const paymentMethod = this.paymentMethods.formas_de_pago.find(
      (pm) => pm.id_forma_de_pago === this.selectedPaymentMethod
    );

    if (!paymentMethod) {
      return;
    }

    const order: CartOrder = {
      id_usuario: userId,
      total: this.totalPrice,
      detalles: this.cartResume.map((product) => ({
        id_talle: product.id_talleSeleccionado,
        id_producto: product.productos.id_producto,
        cantidad: product.cantidad,
        subtotal: product.productos.precio * product.cantidad,
      })),
      forma_de_pago: [
        {
          id_forma_de_pago: paymentMethod.id_forma_de_pago,
          id_tarjeta:
            this.selectedPaymentMethod === 3 ? this.selectedCreditCard : null,
        },
      ],
    };

    this.apiService.postWithAuth<CartOrder>(this.ordersUrl, order).subscribe({
      next: (createdOrder) => {
        this.toastr.success('¡Pedido creado exitosamente!', 'Pedido');
        this.dismissModal();
        this.clearCart();
      },
      error: (error) => {
        this.toastr.error('Hubo un error al crear el pedido.', 'Error');
      },
    });
  }

  dismissModal(): void {
    this.renderer.setAttribute(
      this.modalForm.nativeElement,
      'data-bs-dismiss',
      'modal'
    );
    this.modalForm.nativeElement.click();
  }

  clearCart(): void {
    this.cartResume = [];
    this.clearCartEvent.emit();
  }
}
