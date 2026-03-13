import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'login' | 'sidebar';
type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.html',
  styleUrl: './button.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  variant = input<ButtonVariant>('primary');
  type = input<ButtonType>('button');
  disabled = input(false);
  loading = input(false);
  loadingLabel = input('Caricamento...');
  fullWidth = input(false);

  pressed = output<MouseEvent>();

  resolvedClass = computed(() => {
    const variantClass = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      danger: 'btn-danger',
      login: 'btn-login',
      sidebar: 'btn-sidebar'
    }[this.variant()];

    return {
      btn: true,
      [variantClass]: true,
      'btn-full': this.fullWidth(),
      'btn-disabled': this.isDisabled()
    };
  });

  isDisabled = computed(() => this.disabled() || this.loading());

  onClick(event: MouseEvent): void {
    if (this.isDisabled()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.pressed.emit(event);
  }
}
