import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './contact-form.component.html',
  styleUrl: './contact-form.component.css',
})
export class ContactFormComponent {
  formBuilder = inject(FormBuilder);
  toastr = inject(ToastrService);


  // Inyectamos HttpClient para hacer peticiones al backend
  http = inject(HttpClient);

  formGroup = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    message: ['', Validators.required],
  });

  // Variable para mostrar cargando en el botón de enviar
  isLoading = false;

  clickRegister(): void {
    const name = this.formGroup.controls.name.value;
    const lastName = this.formGroup.controls.lastName.value;
    const email = this.formGroup.controls.email.value;
    const message = this.formGroup.controls.message.value;
    console.log({ name, lastName, email, message });
  }

  // Modifico onEnviar para que se conecte con el backend
  onEnviar(event: Event) {
    event.preventDefault();

    console.log(this.formGroup.value);

    // Enviamos el formulario al backend
    if (this.formGroup.valid) {
      this.isLoading = true; // Activamos cargando en el botón
      this.toastr.info('Enviando formulario al servidor...');


      // Obtenemos los valores del formulario
      const formData = this.formGroup.value;

      // Enviamos los datos al backend Django
      this.http.post('http://localhost:8000/api/contact', formData).subscribe({
        next: (response) => {
          console.log('Respuesta del servidor:', response);
          this.toastr.success('Formulario enviado con éxito!');
          this.formGroup.reset(); // Limpiamos el formulario
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al enviar:', error);
          this.toastr.error('Hubo un error al enviar el formulario');
          this.isLoading = false;
        },
      });
    } else {
      this.formGroup.markAllAsTouched();
      this.toastr.warning('Por favor, complete todos los campos correctamente.');
    }
  }
}
