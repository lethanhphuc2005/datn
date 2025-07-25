import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { WebsiteContentService } from '@/core/services/website-content.service';
import { ContentTypeService } from '@/core/services/content-type.service';
import {
  WebsiteContent,
  WebsiteContentFilter,
  WebsiteContentRequest,
} from '@/types/website-content';
import { ContentType } from '@/types/content-type';
import { ToastrService } from 'ngx-toastr';
import { WebsiteContentListComponent } from './website-content-list/website-content-list.component';
import { WebsiteContentFormComponent } from './website-content-form/website-content-form.component';
import { CommonFilterBarComponent } from '@/shared/components/common-filter-bar/common-filter-bar.component';
import { PaginationComponent } from '@/shared/components/pagination/pagination.component';
import { compressImage } from '@/shared/utils/image.utils';

@Component({
  selector: 'app-website-content',
  imports: [
    CommonModule,
    FormsModule,
    WebsiteContentListComponent,
    WebsiteContentFormComponent,
    CommonFilterBarComponent,
    PaginationComponent,
  ],
  templateUrl: './website-content.component.html',
  styleUrl: './website-content.component.scss',
})
export class WebsiteContentComponent implements OnInit {
  websiteContents: WebsiteContent[] = [];
  contentTypes: ContentType[] = [];
  selectedWebsiteContent: WebsiteContent | null = null;
  isAddPopupOpen = false;
  isEditPopupOpen = false;
  imagePreview: string | null = null;
  newWebsiteContent: WebsiteContentRequest = {
    title: '',
    content: '',
    content_type_id: undefined,
    image: undefined,
    status: true,
  };
  filter: WebsiteContentFilter = {
    search: '',
    page: 1,
    limit: 10,
    total: 0,
    sort: 'createdAt',
    order: 'desc',
    status: '',
  };

  constructor(
    private websitecontentService: WebsiteContentService,
    private contentTypeService: ContentTypeService,
    private toastService: ToastrService
  ) {}
  ngOnInit(): void {
    this.loadAllContentTypes();
    this.loadAllWebsiteContents();
  }

  loadAllWebsiteContents() {
    this.websitecontentService.getAllWebsiteContents(this.filter).subscribe({
      next: (response) => {
        this.websiteContents = response.data;
        this.filter.total = response.pagination.total;
      },
      error: (error) => {
        console.error('Error fetching website contents:', error);
        this.toastService.error(error.error?.message, 'Lỗi');
        this.websiteContents = [];
      },
    });
  }

  loadAllContentTypes() {
    this.contentTypeService
      .getAllContentTypes({
        page: 1,
        limit: 100,
        total: 0,
        status: 'true',
      })
      .subscribe({
        next: (response) => {
          this.contentTypes = response.data;
        },
        error: (error) => {
          console.error('Error fetching content types:', error);
          this.toastService.error(error.error?.message, 'Lỗi');
          this.contentTypes = [];
        },
      });
  }

  onPageChange(page: number): void {
    this.filter.page = page;
    this.loadAllWebsiteContents();
  }

  onFilterChange(sortField?: string): void {
    if (sortField) {
      this.filter.sort = sortField;
      this.filter.order = this.filter.order === 'asc' ? 'desc' : 'asc'; // Toggle sort order
    }
    this.filter.page = 1; // Reset to first page on filter change
    this.loadAllWebsiteContents();
  }

  onToggleChange(event: Event, item: WebsiteContent): void {
    const checkbox = event.target as HTMLInputElement;
    const originalStatus = item.status;
    const newStatus = checkbox.checked;

    // Optimistically update status
    item.status = newStatus;

    this.websitecontentService.toggleWebsiteContentStatus(item.id).subscribe({
      next: () => {
        // Thành công → giữ nguyên status
        this.toastService.success(
          `Trạng thái nội dung "${item.title}" đã được cập nhật thành ${
            newStatus ? 'Kích hoạt' : 'Vô hiệu hóa'
          }.`,
          'Thành công'
        );
      },
      error: (err) => {
        // Thất bại → rollback
        item.status = originalStatus;
        this.toastService.error(
          err.error?.message || err.message || err.statusText,
          'Lỗi'
        );
      },
    });
  }

  onOpenPopup(isAddForm: boolean, item?: WebsiteContent): void {
    this.isAddPopupOpen = isAddForm;
    this.isEditPopupOpen = !isAddForm;

    if (isAddForm) {
      // Reset form thêm mới
      this.selectedWebsiteContent = null;
      this.newWebsiteContent = {
        title: '',
        content: '',
        content_type_id: undefined,
        image: undefined,
        status: true,
      };
    } else if (item) {
      // Mở form chỉnh sửa
      this.selectedWebsiteContent = item;
      this.newWebsiteContent = {
        title: item.title,
        content: item.content,
        content_type_id: item.content_type_id,
        image: null, // Không hiển thị ảnh cũ trong form chỉnh sửa
        status: item.status,
      };
    }
  }

  onClosePopup(): void {
    this.isAddPopupOpen = false;
    this.isEditPopupOpen = false;
    this.selectedWebsiteContent = null;
  }

  onFileSelected(file: File): void {
    this.newWebsiteContent.uploadImage = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  async onAddSubmit(): Promise<void> {
    const formData = new FormData();
    formData.append('title', this.newWebsiteContent.title || '');
    formData.append('content', this.newWebsiteContent.content || '');
    formData.append(
      'content_type_id',
      this.newWebsiteContent.content_type_id?.toString() || ''
    );
    formData.append(
      'status',
      this.newWebsiteContent.status?.toString() || 'true'
    );

    if (this.newWebsiteContent.uploadImage) {
      const compressedFile = await compressImage(
        this.newWebsiteContent.uploadImage,
        1,
        1920
      );
      formData.append('image', compressedFile);
    }

    this.websitecontentService.createWebsiteContent(formData).subscribe({
      next: () => {
        this.loadAllWebsiteContents();
        this.isAddPopupOpen = false;
        this.toastService.success(
          'Thêm nội dung website thành công',
          'Thành công'
        );
      },
      error: (err) => {
        this.toastService.error(
          err.error?.message || err.message || err.statusText,
          'Lỗi'
        );
      },
    });
  }

  async onEditSubmit(): Promise<void> {
    if (!this.selectedWebsiteContent) return;

    const formData = new FormData();
    formData.append('title', this.selectedWebsiteContent.title || '');
    formData.append('content', this.selectedWebsiteContent.content || '');
    formData.append(
      'content_type_id',
      this.selectedWebsiteContent.content_type_id?.toString() || ''
    );
    if (this.newWebsiteContent.uploadImage) {
      const compressedFile = await compressImage(
        this.newWebsiteContent.uploadImage,
        1,
        1920
      );
      formData.append('image', compressedFile);
    }

    this.websitecontentService
      .updateWebsiteContent(this.selectedWebsiteContent.id, formData)
      .subscribe({
        next: () => {
          this.loadAllWebsiteContents();
          this.isEditPopupOpen = false;
          this.toastService.success(
            'Cập nhật nội dung website thành công',
            'Thành công'
          );
        },
        error: (err) => {
          this.toastService.error(
            err.error?.message || err.message || err.statusText,
            'Lỗi'
          );
        },
      });
  }

  onDeleteSubmit(contentId: string): void {
    if (!contentId) return;
    if (!confirm('Bạn có chắc chắn muốn xóa nội dung này?')) return;

    this.websitecontentService.deleteWebsiteContent(contentId).subscribe({
      next: () => {
        this.loadAllWebsiteContents();
        this.toastService.success(
          'Xóa nội dung website thành công',
          'Thành công'
        );
      },
      error: (err) => {
        this.toastService.error(
          err.error?.message || err.message || err.statusText,
          'Lỗi'
        );
      },
    });
  }
}
