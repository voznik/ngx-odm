import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { BigInputComponent } from './big-input/big-input.component';
import { BigInputActionComponent } from './big-input/big-input-action.component';
import { MaterialModule } from './material.module';

@NgModule({
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, MaterialModule
  ],
  declarations: [
    BigInputComponent,
    BigInputActionComponent,
  ],
  exports: [
    FormsModule, ReactiveFormsModule, MaterialModule,
    BigInputComponent,
    BigInputActionComponent,
  ]
})
export class SharedModule { }
