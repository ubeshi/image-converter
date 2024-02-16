import { Component, ElementRef, ViewChild } from '@angular/core';

interface ImageFile {
  dataUrl: string;
  fileName: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @ViewChild('outputFormatSelect') private outputFormatSelect: ElementRef | undefined;

  public imageFiles: ImageFile[] = [];

  async handleFileUploaded(event: Event): Promise<void> {
    const fileList = (event.target as HTMLInputElement).files;
    if (fileList) {
      this.imageFiles = [];
      for (let fileIndex = 0; fileIndex < fileList.length; fileIndex++) {
        const file = fileList.item(fileIndex);
        if (file) {
          const dataUrl = await this.getFileAsDataUrl(file);
          const fileName = this.getOutputFileName(file, this.outputFormatSelect?.nativeElement.value);
          this.imageFiles.push({ dataUrl, fileName });
        }
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

  getFileNames(imageFiles: ImageFile[]): string {
    return imageFiles.map(({ fileName }) => fileName).join(', ');
  }

  handleOutputFormatChanged(event: Event): void {
    if (this.imageFiles.length > 0) {
      const outputFormat = (event.target as HTMLSelectElement).value;
      this.imageFiles = this.imageFiles.map(({ dataUrl, fileName }) => {
        const newFileName = this.getOutputFileName({ name: fileName }, outputFormat);
        return { dataUrl, fileName: newFileName };
      });
    }
  }

  async handleExportClicked(): Promise<void> {
    const outputFormat = this.outputFormatSelect?.nativeElement.value ?? 'image/webp';

    await Promise.all(this.imageFiles.map(async ({ fileName, dataUrl }) => {
      const exportCanvas = document.createElement('canvas');
      await this.setCanvasImageDataUrl(exportCanvas, dataUrl);
      const imageUrl = exportCanvas.toDataURL(outputFormat).replace(outputFormat, 'image/octet-stream');
      exportCanvas.remove();

      const temporaryDownloadLink = document.createElement("a");
      temporaryDownloadLink.style.display = 'none';
      temporaryDownloadLink.setAttribute('href', imageUrl);
      temporaryDownloadLink.setAttribute('download', fileName);
      temporaryDownloadLink.click();
      temporaryDownloadLink.remove();
    }));
  }
}
