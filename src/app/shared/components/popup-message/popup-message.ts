import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PopupMessageService } from '../../services/popup-message.service';

@Component({
  selector: 'app-popup-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './popup-message.html',
  styleUrl: './popup-message.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopupMessageComponent {
  private readonly popupMessageService = inject(PopupMessageService);

  message = this.popupMessageService.message;

  icon = computed(() => this.message()?.type === 'success' ? 'check' : 'error');

  close(): void {
    this.popupMessageService.dismiss();
  }
}
