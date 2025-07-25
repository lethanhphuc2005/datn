import { ImageHelperService } from '@/shared/services/image-helper.service';
import { ContentType } from '@/types/content-type';
import { WebsiteContentRequest } from '@/types/website-content';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-website-content-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './website-content-form.component.html',
  styleUrl: './website-content-form.component.scss',
})
export class WebsiteContentFormComponent {
  @Input() contentTypes: ContentType[] = [];
  @Input() websiteContent: WebsiteContentRequest = {};
  @Input() isEdit: boolean = false;
  @Input() imagePreview: string | null = null;
  @Output() submitForm = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  @Output() fileSelected = new EventEmitter<File>();

  constructor(private imageHelperService: ImageHelperService) {}

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.fileSelected.emit(input.files[0]);
    }
  }

  getImageUrl(image: string| File): string {
    return this.imageHelperService.getImageUrl(image);
  }
}
