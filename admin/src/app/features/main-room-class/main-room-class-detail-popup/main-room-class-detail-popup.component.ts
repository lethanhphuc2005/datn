import { MainRoomClass } from '@/types/main-room-class';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ImageHelperService } from '@/shared/services/image-helper.service';

@Component({
  selector: 'app-main-room-class-detail-popup',
  imports: [CommonModule, FormsModule],
  templateUrl: './main-room-class-detail-popup.component.html',
  styleUrl: './main-room-class-detail-popup.component.scss',
})
export class MainRoomClassDetailPopupComponent {
  @Input() mainRoomClass!: MainRoomClass;
  @Output() closePopup = new EventEmitter();

  constructor(private imageHelperService: ImageHelperService) {}

  getImageUrl(imagePath: string): string {
    return this.imageHelperService.getImageUrl(imagePath);
  }
}
