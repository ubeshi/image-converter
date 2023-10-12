import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @ViewChild('outputFormatSelect') private outputFormatSelect: ElementRef | undefined;
  @ViewChild('downloadLink') private downloadLink: ElementRef | undefined;

  public dataUrl: string | undefined;
  public fileName: string | undefined;

  private exportCanvas = document.createElement('canvas');

  async handleFileUploaded(event: Event): Promise<void> {
    const fileList = (event.target as HTMLInputElement).files;
    if (fileList) {
      const file = fileList.item(0);
      if (file) {
        this.fileName = file.name;
        const dataUrl = await this.getFileAsDataUrl(file);
        this.dataUrl = dataUrl;
        this.fileName = this.getOutputFileName(file, this.outputFormatSelect?.nativeElement.value);
        await this.setCanvasImageDataUrl(this.exportCanvas, dataUrl);
      }
    }
  }

  getFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => {
        resolve(fileReader.result as string);
      }
    });
  }

  setCanvasImageDataUrl(canvas: HTMLCanvasElement, dataUrl: string): Promise<void> {
    const imageElement = document.createElement('img');
    imageElement.src = dataUrl;
    return new Promise((resolve) => {
      imageElement.onload = () => {
        canvas.width = imageElement.width;
        canvas.height = imageElement.height;
        const context = canvas.getContext('2d');
        context?.drawImage(imageElement, 0, 0, imageElement.width, imageElement.height);
        resolve();
      }
    });
  }

  getOutputFileName(inputFile: { name: string }, outputMimeType: string): string {
    const newExtension = outputMimeType.split('/')[1];
    const splitName = inputFile.name.split('.');
    splitName.pop();
    splitName.push(newExtension);
    return splitName.join('.');
  }

  handleOutputFormatChanged(event: Event): void {
    if (this.fileName) {
      const outputFormat = (event.target as HTMLSelectElement).value;
      this.fileName = this.getOutputFileName({ name: this.fileName }, outputFormat);
    }
  }

  handleExportClicked(): void {
    const outputFormat = this.outputFormatSelect?.nativeElement.value ?? 'image/webp';
    const imageUrl = this.exportCanvas.toDataURL(outputFormat).replace(outputFormat, 'image/octet-stream');
    this.downloadLink?.nativeElement.setAttribute('href', imageUrl);
    this.downloadLink?.nativeElement.setAttribute('download', this.fileName);
  }
}
