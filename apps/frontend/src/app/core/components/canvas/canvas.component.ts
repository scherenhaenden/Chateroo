import { Component, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as fabric from 'fabric';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('canvasContainer', { static: false }) canvasContainer!: ElementRef;
  private canvas!: fabric.Canvas;
  public isDrawingMode = true;

  ngAfterViewInit(): void {
    this.initializeCanvas();
  }

  // Listen for window resize events to keep the canvas responsive
  @HostListener('window:resize', ['$event'])
  onResize(_event: Event): void {
    this.resizeCanvas();
  }

  private initializeCanvas(): void {
    // Create a new Fabric.js canvas
    this.canvas = new fabric.Canvas('chaterooCanvas', {
      isDrawingMode: this.isDrawingMode,
      backgroundColor: '#f8f8f8',
      selection: false,
    });

    // Configure the brush
    this.canvas.freeDrawingBrush!.color = '#000000';
    this.canvas.freeDrawingBrush!.width = 5;

    // Set initial dimensions
    this.resizeCanvas();
  }

  private resizeCanvas(): void {
    const container = this.canvasContainer.nativeElement;
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    this.canvas.setDimensions({ width, height });
    this.canvas.renderAll();
  }

  // --- Public Methods for UI Controls ---

  public toggleDrawingMode(): void {
    this.isDrawingMode = !this.isDrawingMode;
    this.canvas.isDrawingMode = this.isDrawingMode;
  }

  public clearCanvas(): void {
    this.canvas.clear();
    // Re-add the background color after clearing
    this.canvas.backgroundColor = '#f8f8f8';
    this.canvas.renderAll();
  }

  public setBrushColor(color: string): void {
    this.canvas.freeDrawingBrush!.color = color;
  }

  public setBrushWidth(width: number): void {
    this.canvas.freeDrawingBrush!.width = width;
  }
}

