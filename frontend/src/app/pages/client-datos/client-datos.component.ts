import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { UserService } from '../../services/users.service';

@Component({
  selector: 'app-client-datos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './client-datos.component.html',
  styleUrls: ['./client-datos.component.css']
})
export class ClientDatosComponent implements OnInit {
  profileForm!: FormGroup;
  editingField: string | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadUserData();
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      nombre: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(2)]],
      apellido: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(2)]],
      domicilio: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(5)]]  
    });
  }

  loadUserData(): void {
    this.isLoading = true;
    this.userService.getUserData().subscribe({
      next: (data: any) => {
        this.profileForm.patchValue({
          nombre: data?.nombre || '',
          apellido: data?.apellido || '',
          domicilio: data?.domicilio || '' 
        });
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Error al cargar los datos del usuario.';
        this.isLoading = false;
      }
    });
  }
  

  startEditing(field: string): void {
    this.editingField = field;
    this.profileForm.get(field)?.enable();
    this.clearMessages();
  }

  cancelEditing(): void {
    if (this.editingField) {
      this.profileForm.get(this.editingField)?.disable();
      this.editingField = null;
      this.loadUserData();
    }
  }

  saveField(field: string): void {
    const control = this.profileForm.get(field);
    if (!control || control.invalid) return;

    const newValue = control.value;
    this.userService.updateUserData(field, newValue).subscribe({
      next: () => {
        this.successMessage = `Campo "${field}" actualizado correctamente.`;
        control.disable();
        this.editingField = null;
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: () => {
        this.errorMessage = `Error al actualizar el campo "${field}".`;
      }
    });
  }

  getFieldError(field: string): string {
    const control = this.profileForm.get(field);
    if (control?.hasError('required')) {
      return 'Este campo es obligatorio.';
    }
    if (control?.hasError('minlength')) {
      const required = control.errors?.['minlength']?.requiredLength;
      return `Debe tener al menos ${required} caracteres.`;
    }
    return '';
  }

  private clearMessages(): void {
    this.errorMessage = null;
    this.successMessage = null;
  }
}
