import { Component, Input, Output, EventEmitter, forwardRef, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';

export interface AutocompleteOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-autocomplete',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="relative">
      <input
        #inputElement
        [formControl]="inputControl"
        [placeholder]="placeholder"
        [disabled]="disabled"
        (focus)="onFocus()"
        (blur)="onBlur()"
        (keydown)="onKeyDown($event)"
        (input)="onInput($event)"
        [class]="inputClasses"
        autocomplete="off"
      />

      <div *ngIf="showDropdown && filteredOptions.length > 0 && !disabled"
           [class]="dropdownClasses"
           class="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
        <div
          *ngFor="let option of filteredOptions; let i = index"
          [class.bg-blue-100]="i === selectedIndex"
          class="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
          (mousedown)="selectOption(option)"
          (mouseenter)="selectedIndex = i">
          {{ option.label }}
        </div>
      </div>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteComponent),
      multi: true
    }
  ]
})
export class AutocompleteComponent implements ControlValueAccessor, OnInit, OnDestroy, OnChanges {
  @Input() options: AutocompleteOption[] = [];
  @Input() placeholder: string = 'Search...';
  @Input() disabled: boolean = false;
  @Output() selectionChange = new EventEmitter<AutocompleteOption | null>();

  @ViewChild('inputElement', { static: false }) inputElement!: ElementRef<HTMLInputElement>;

  public inputControl = new FormControl('');
  public filteredOptions: AutocompleteOption[] = [];
  public showDropdown = false;
  public selectedIndex = -1;
  public dropdownClasses = '';
  private sortedOptions: AutocompleteOption[] = [];

  private destroy$ = new Subject<void>();
  private value: string = '';
  private onChange = (_value: string) => {};
  private onTouched = () => {};

  ngOnInit() {
    // Don't subscribe to valueChanges here to avoid conflicts
    this.sortAndFilterOptions();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['options'] && changes['options'].currentValue) {
      this.sortAndFilterOptions();
      // If we have a value, try to find and display the corresponding label
      if (this.value) {
        this.updateDisplayValue();
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private sortAndFilterOptions() {
    this.sortedOptions = [...this.options].sort((a, b) => a.label.localeCompare(b.label));
    this.filterOptions(this.inputControl.value || '');
  }

  private updateDisplayValue() {
    const option = this.sortedOptions.find(opt => opt.value === this.value);
    if (option) {
      this.inputControl.setValue(option.label, { emitEvent: false });
    }
  }

  private filterOptions(searchValue: string) {
    if (!searchValue) {
      this.filteredOptions = [...this.sortedOptions];
    } else {
      this.filteredOptions = this.sortedOptions.filter(option =>
        option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
        option.value.toLowerCase().includes(searchValue.toLowerCase())
      );
    }
    this.selectedIndex = -1;
  }

  private calculateDropdownPosition(): void {
    if (!this.inputElement) return;

    const inputRect = this.inputElement.nativeElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 240; // max-h-60 = 240px aproximadamente
    const spaceBelow = viewportHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;

    // Si hay suficiente espacio abajo, mostrar hacia abajo
    if (spaceBelow >= dropdownHeight) {
      this.dropdownClasses = 'mt-1 top-full';
    }
    // Si hay más espacio arriba que abajo, mostrar hacia arriba
    else if (spaceAbove > spaceBelow) {
      this.dropdownClasses = 'mb-1 bottom-full';
    }
    // Si no hay suficiente espacio en ningún lado, mostrar hacia abajo pero ajustar altura
    else {
      this.dropdownClasses = 'mt-1 top-full';
    }
  }

  public get inputClasses(): string {
    const baseClasses = 'w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
    const disabledClasses = this.disabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-50';
    return `${baseClasses} ${disabledClasses}`;
  }

  public onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const searchValue = input.value || '';
    this.filterOptions(searchValue);
    this.showDropdown = true;
    this.calculateDropdownPosition(); // Calculate position when showing dropdown

    // If the input doesn't match any option exactly, clear the value
    const exactMatch = this.sortedOptions.find(opt => opt.label === searchValue);
    if (exactMatch) {
      this.value = exactMatch.value;
      this.onChange(exactMatch.value);
      this.selectionChange.emit(exactMatch);
    } else {
      this.value = '';
      this.onChange('');
      this.selectionChange.emit(null);
    }
  }

  public onFocus() {
    this.showDropdown = true;
    this.filterOptions(this.inputControl.value || '');
    this.calculateDropdownPosition(); // Calculate position when showing dropdown
  }

  public onBlur() {
    // Delay hiding dropdown to allow for selection
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
    this.onTouched();
  }

  public onKeyDown(event: KeyboardEvent) {
    if (!this.showDropdown) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        event.preventDefault();
        this.showDropdown = true;
        this.filterOptions(this.inputControl.value || '');
        this.calculateDropdownPosition(); // Calculate position when showing dropdown via keyboard
        return;
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredOptions.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredOptions.length) {
          this.selectOption(this.filteredOptions[this.selectedIndex]);
        }
        break;
      case 'Escape':
        this.showDropdown = false;
        break;
    }
  }

  public selectOption(option: AutocompleteOption) {
    this.inputControl.setValue(option.label, { emitEvent: false });
    this.value = option.value;
    this.onChange(option.value);
    this.selectionChange.emit(option);
    this.showDropdown = false;
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
    if (this.sortedOptions.length > 0) {
      this.updateDisplayValue();
    } else {
      // If options aren't loaded yet, just set the raw value
      this.inputControl.setValue(value || '', { emitEvent: false });
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.inputControl.disable();
    } else {
      this.inputControl.enable();
    }
  }
}
